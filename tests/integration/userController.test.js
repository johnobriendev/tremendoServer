const request = require('supertest');
const app = require('../../app'); 
const mongoose = require('mongoose');
const User = require('../../models/User'); 
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { Resend } = require('resend');
const crypto = require('crypto');

// Mock external services
jest.mock('axios');
jest.mock('resend', () => {
  return {
    Resend: jest.fn().mockImplementation(() => {
      return {
        emails: {
          send: jest.fn().mockResolvedValue({ id: 'mock-email-id' })
        }
      };
    })
  };
});

describe('User Controller', () => {
  let mockResendSend;
  let server;
  
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/kanban-test');
    server = app.listen(0);
  });

  afterAll(async () => {
    await mongoose.connection.close();
    await new Promise((resolve) => server.close(resolve));
    
  });

  beforeEach(async () => {
    await User.deleteMany({});
    jest.clearAllMocks();
    mockResendSend = jest.spyOn(Resend().emails, 'send');
    Resend.mockImplementation(() => ({
      emails: {
        send: mockResendSend
      }
    }));
  });

  describe('POST /users/register', () => {
    beforeEach(() => {
      // Mock successful reCAPTCHA verification
      axios.post.mockResolvedValue({ data: { success: true } });
    });

    it('should register a new user successfully', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        recaptchaToken: 'valid-token'
      };

      const res = await request(app)
        .post('/users/register')
        .send(userData);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.email).toBe(userData.email);
      expect(res.body.name).toBe(userData.name);
      expect(res.body).toHaveProperty('message', 'Registration successful. Please check your email to verify your account.');
    });

    it('should not register user with invalid email', async () => {
      const res = await request(app)
        .post('/users/register')
        .send({
          name: 'Test User',
          email: 'invalid-email',
          password: 'password123',
          recaptchaToken: 'valid-token'
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('errors');
    });

    it('should not register user with existing email', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        recaptchaToken: 'valid-token'
      };

      // First registration
      await request(app)
        .post('/users/register')
        .send(userData);

      // Second registration with same email
      const res = await request(app)
        .post('/users/register')
        .send(userData);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'User already exists');
    });

    it('should not register user with failed reCAPTCHA', async () => {
      axios.post.mockResolvedValue({ data: { success: false } });

      const res = await request(app)
        .post('/users/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          recaptchaToken: 'invalid-token'
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'reCAPTCHA verification failed');
    });
  });

  describe('POST /users/login', () => {
    beforeEach(async () => {
      // Create a verified user before each login test
      const hashedPassword = await bcrypt.hash('password123', 10);
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: hashedPassword,
        isVerified: true
      });
    });

    it('should login verified user with correct credentials', async () => {
      const res = await request(app)
        .post('/users/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe('test@example.com');
    });

    it('should not login unverified user', async () => {
      await User.findOneAndUpdate(
        { email: 'test@example.com' },
        { isVerified: false }
      );

      const res = await request(app)
        .post('/users/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('message', 'Please verify your email before logging in');
    });

    it('should not login with incorrect password', async () => {
      const res = await request(app)
        .post('/users/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('message', 'Invalid email or password');
    });
  });

  describe('GET /users', () => {
    let token;
    let userId;

    beforeEach(async () => {
      // Create a user and generate token
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 10)
      });
      userId = user._id;
      token = jwt.sign({ id: userId.toString() }, process.env.JWT_SECRET);
    });

    it('should get user data with valid token', async () => {
      const res = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('email', 'test@example.com');
      expect(res.body).not.toHaveProperty('password');
    });

    it('should not get user data with invalid token', async () => {
      const res = await request(app)
        .get('/users')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
    });
  });

  describe('POST /users/verify-email', () => {
    let verificationToken;
    let user;

    beforeEach(async () => {
      verificationToken = jwt.sign({ email: 'test@example.com' }, process.env.JWT_SECRET);
      user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 10),
        verificationToken,
        verificationTokenExpires: Date.now() + 24 * 60 * 60 * 1000
      });
    });

    it('should verify email with valid token', async () => {
      const res = await request(app)
        .get('/users/verify-email')
        .query({ token: verificationToken });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('message', 'Email verified successfully');

      const updatedUser = await User.findById(user._id);
      expect(updatedUser.isVerified).toBe(true);
    });

    it('should not verify with invalid token', async () => {
      const res = await request(app)
        .get('/users/verify-email')
        .query({ token: 'invalid-token' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /users/request-password-reset', () => {
    it('should update user with reset token for valid user', async () => {
      // Create a user
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 10),
        isVerified: true
      });

      const res = await request(app)
        .post('/users/request-password-reset')
        .send({ email: 'test@example.com' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Password reset email sent');

      // Verify that the user's resetPasswordToken and resetPasswordExpires fields are updated
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.resetPasswordToken).toBeDefined();
      expect(updatedUser.resetPasswordExpires).toBeDefined();
      expect(updatedUser.resetPasswordExpires).toBeInstanceOf(Date);
      expect(updatedUser.resetPasswordExpires.getTime()).toBeGreaterThan(Date.now());
    });

    it('should not send reset email for non-existent user', async () => {
      const res = await request(app)
        .post('/users/request-password-reset')
        .send({ email: 'nonexistent@example.com' });

      expect(res.status).toBe(404);
      expect(mockResendSend).not.toHaveBeenCalled();
    });
  });

  describe('POST /users/reset-password', () => {
    let resetToken;
    let user;

    beforeEach(async () => {
      // Create a plaintext reset token
      const plaintextResetToken = 'valid-reset-token';
      
      // Hash the reset token
      const hashedResetToken = crypto
        .createHash('sha256')
        .update(plaintextResetToken)
        .digest('hex');

      // Create user with isVerified set to true
      user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: await bcrypt.hash('oldpassword', 10),
        resetPasswordToken: hashedResetToken,
        resetPasswordExpires: Date.now() + 3600000,
        isVerified: true  // Make sure the user is verified
      });

      // Create JWT token with both user ID and reset token
      resetToken = jwt.sign(
        { 
          id: user._id.toString(),
          resetToken: hashedResetToken  // Use plaintext token in JWT
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
    });

    it('should reset password with valid token', async () => {
      const res = await request(app)
        .post('/users/reset-password')
        .query({ token: resetToken })
        .send({
          password: 'newpassword123',
          confirmPassword: 'newpassword123'
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Password reset successful');

      // Wait a short time to ensure password update is complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify new password works
      const loginRes = await request(app)
        .post('/users/login')
        .send({
          email: 'test@example.com',
          password: 'newpassword123'
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body).toHaveProperty('token');
      expect(loginRes.body).toHaveProperty('user');
      expect(loginRes.body.user.email).toBe('test@example.com');
    });

    it('should not reset password with mismatched passwords', async () => {
      const res = await request(app)
        .post('/users/reset-password')
        .query({ token: resetToken })
        .send({
          password: 'newpassword123',
          confirmPassword: 'differentpassword'
        });

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });
  });

});