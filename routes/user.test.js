const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app'); // Import your Express app
const User = require('../models/User'); // Import your User model
const jwt = require('jsonwebtoken');

// Mock data to use in the tests
const mockUser = {
  username: 'testuser',
  email: 'testuser@example.com',
  password: 'Test1234!',
};

describe('User Routes', () => {
  // Connect to the test database before running any tests
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI_TEST, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  // Clear the database before each test to ensure a clean state
  beforeEach(async () => {
    await User.deleteMany({});
  });

  // Disconnect from the database after all tests are done
  afterAll(async () => {
    await mongoose.disconnect();
  });

  // Test registration route
  describe('POST /register', () => {
    it('should register a new user with valid data', async () => {
      const response = await request(app)
        .post('/api/users/register')
        .send(mockUser)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('username', mockUser.username);
      expect(response.body).toHaveProperty('email', mockUser.email);
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/users/register')
        .send({ email: 'missingPassword@example.com' }) // Missing username and password
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.error).toBe('Username and password are required');
    });
  });

  // Test login route
  describe('POST /login', () => {
    it('should login a registered user with valid credentials', async () => {
      // Register a user first
      await request(app)
        .post('/api/users/register')
        .send(mockUser)
        .expect(201);

      // Now, attempt to login
      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: mockUser.email,
          password: mockUser.password,
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('token');
    });

    it('should return 401 for invalid credentials', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'WrongPassword!',
        })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.error).toBe('Invalid email or password');
    });
  });

  // Test password reset request
  describe('POST /request-password-reset', () => {
    it('should request a password reset for an existing user', async () => {
      await request(app)
        .post('/api/users/register')
        .send(mockUser)
        .expect(201);

      const response = await request(app)
        .post('/api/users/request-password-reset')
        .send({ email: mockUser.email })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.message).toBe('Password reset link sent');
    });

    it('should return 404 if email is not registered', async () => {
      const response = await request(app)
        .post('/api/users/request-password-reset')
        .send({ email: 'unknown@example.com' })
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body.error).toBe('User not found');
    });
  });

  // Test password reset
  describe('POST /reset-password', () => {
    it('should reset the password with a valid token', async () => {
      // Register a user first
      const registerResponse = await request(app)
        .post('/api/users/register')
        .send(mockUser)
        .expect(201);

      const userId = registerResponse.body._id;
      const resetToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1h' });

      const response = await request(app)
        .post('/api/users/reset-password')
        .send({ token: resetToken, newPassword: 'NewPass123!' })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.message).toBe('Password has been reset');
    });

    it('should return 400 for an invalid token', async () => {
      const response = await request(app)
        .post('/api/users/reset-password')
        .send({ token: 'invalidtoken', newPassword: 'NewPass123!' })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.error).toBe('Invalid or expired token');
    });
  });

  // Test email verification
  describe('GET /verify-email', () => {
    it('should verify email with a valid token', async () => {
      // Register a user first
      const registerResponse = await request(app)
        .post('/api/users/register')
        .send(mockUser)
        .expect(201);

      const userId = registerResponse.body._id;
      const verificationToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1h' });

      const response = await request(app)
        .get(`/api/users/verify-email?token=${verificationToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.message).toBe('Email verified successfully');
    });

    it('should return 400 for an invalid verification token', async () => {
      const response = await request(app)
        .get('/api/users/verify-email?token=invalidtoken')
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.error).toBe('Invalid or expired token');
    });
  });

  // Test authenticated route (e.g., get user data)
  describe('GET /', () => {
    it('should get user data if authenticated', async () => {
      // Register and login a user to get a token
      const userData = {
        username: 'authUser',
        email: 'authuser@example.com',
        password: 'Auth1234!',
      };

      await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(201);

      const loginResponse = await request(app)
        .post('/api/users/login')
        .send({
          email: 'authuser@example.com',
          password: 'Auth1234!',
        })
        .expect(200);

      const token = loginResponse.body.token;

      // Use the token to get user data
      const response = await request(app)
        .get('/api/users/')
        .set('Authorization', `Bearer ${token}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('username', 'authUser');
    });

    it('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .get('/api/users/')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });
  });
});

