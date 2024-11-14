// const request = require('supertest');
// const mongoose = require('mongoose');
// const { MongoMemoryServer } = require('mongodb-memory-server');
// const app = require('../app');
// const User = require('../models/User');
// const jwt = require('jsonwebtoken');
// const bcrypt = require('bcryptjs');
// const crypto = require('crypto');

// // Set up environment variables for testing
// process.env.JWT_SECRET = 'test-secret-key';
// process.env.FRONTEND_URL = 'http://localhost:5173';
// process.env.RECAPTCHA_SECRET_KEY = 'test-recaptcha-key';

// // Mock external services
// jest.mock('axios');
// jest.mock('resend', () => ({
//   Resend: jest.fn().mockImplementation(() => ({
//     emails: {
//       send: jest.fn().mockResolvedValue({ id: 'mock-email-id' })
//     }
//   }))
// }));

// let mongoServer;
// const agent = request.agent(app);

// const setupDatabase = async () => {
//   try {
//     if (mongoose.connection.readyState !== 0) {
//       await mongoose.disconnect();
//     }
//     mongoServer = await MongoMemoryServer.create();
//     const mongoUri = mongoServer.getUri();
//     await mongoose.connect(mongoUri, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true
//     });
//   } catch (error) {
//     console.error('Error setting up test database:', error);
//     throw error;
//   }
// };

// const teardownDatabase = async () => {
//   try {
//     if (mongoose.connection.readyState !== 0) {
//       await mongoose.disconnect();
//     }
//     if (mongoServer) {
//       await mongoServer.stop();
//     }
//   } catch (error) {
//     console.error('Error tearing down test database:', error);
//     throw error;
//   }
// };

// beforeAll(async () => {
//   await setupDatabase();
// });

// afterAll(async () => {
//   await teardownDatabase();
// });

// beforeEach(async () => {
//   if (mongoose.connection.readyState !== 0) {
//     await User.deleteMany({});
//   }
//   jest.clearAllMocks();
//   require('axios').post.mockResolvedValue({
//     data: { success: true }
//   });
// });

// describe('User Routes', () => {
//   describe('POST /users/register', () => {
//     const validUserData = {
//       name: 'Test User',
//       email: 'test@example.com',
//       password: 'Password123!',
//       recaptchaToken: 'valid-token'
//     };

//     it('should register a new user successfully', async () => {
//       const response = await agent
//         .post('/users/register')
//         .send(validUserData);

//       expect(response.status).toBe(201);
//       expect(response.body).toHaveProperty('_id');
//       expect(response.body).toHaveProperty('email', validUserData.email);
//       expect(response.body).toHaveProperty('name', validUserData.name);
//       expect(response.body.message).toContain('Registration successful');

//       const user = await User.findOne({ email: validUserData.email });
//       expect(user).toBeTruthy();
//       expect(user.isVerified).toBe(false);
//       expect(user.verificationToken).toBeTruthy();
//       expect(user.verificationTokenExpires).toBeTruthy();
//       expect(user.password).not.toBe(validUserData.password);
//       expect(await bcrypt.compare(validUserData.password, user.password)).toBe(true);
//     });

//     it('should fail registration with invalid reCAPTCHA', async () => {
//       require('axios').post.mockResolvedValue({
//         data: { success: false }
//       });

//       const response = await agent
//         .post('/users/register')
//         .send(validUserData);

//       expect(response.status).toBe(400);
//       expect(response.body.message).toContain('reCAPTCHA verification failed');
//     });

//     it('should handle email service failure', async () => {
//       const { Resend } = require('resend');
//       const mockResend = new Resend();
//       mockResend.emails.send.mockRejectedValue(new Error('Email service error'));

//       const response = await agent
//         .post('/users/register')
//         .send(validUserData);

//       expect(response.status).toBe(500);
//       expect(response.body.message).toContain('Unable to send verification email');

//       const user = await User.findOne({ email: validUserData.email });
//       expect(user).toBeFalsy();
//     });

//     it('should reject registration with existing email', async () => {
//       await agent
//         .post('/users/register')
//         .send(validUserData);

//       const response = await agent
//         .post('/users/register')
//         .send(validUserData);

//       expect(response.status).toBe(400);
//       expect(response.body.message).toBe('User already exists');
//     });
//   });

//   describe('POST /users/login', () => {
//     const userData = {
//       name: 'Test User',
//       email: 'test@example.com',
//       password: 'Password123!'
//     };

//     beforeEach(async () => {
//       const hashedPassword = await bcrypt.hash(userData.password, 10);
//       await User.create({
//         ...userData,
//         password: hashedPassword,
//         isVerified: true
//       });
//     });

//     it('should login successfully with correct credentials', async () => {
//       const response = await agent
//         .post('/users/login')
//         .send({
//           email: userData.email,
//           password: userData.password
//         });

//       expect(response.status).toBe(200);
//       expect(response.body).toHaveProperty('token');
//       expect(response.body.user).toHaveProperty('email', userData.email);
      
//       const decodedToken = jwt.verify(response.body.token, process.env.JWT_SECRET);
//       expect(decodedToken).toHaveProperty('id');
//     });

//     it('should reject login with incorrect password', async () => {
//       const response = await agent
//         .post('/users/login')
//         .send({
//           email: userData.email,
//           password: 'WrongPassword123!'
//         });

//       expect(response.status).toBe(401);
//       expect(response.body.message).toBe('Invalid email or password');
//     });

//     it('should reject login for unverified user', async () => {
//       await User.findOneAndUpdate(
//         { email: userData.email },
//         { isVerified: false }
//       );

//       const response = await agent
//         .post('/users/login')
//         .send({
//           email: userData.email,
//           password: userData.password
//         });

//       expect(response.status).toBe(401);
//       expect(response.body.message).toContain('Please verify your email');
//     });
//   });

//   describe('GET /users/verify-email', () => {
//     let user;
//     let verificationToken;

//     beforeEach(async () => {
//       verificationToken = jwt.sign(
//         { email: 'test@example.com' },
//         process.env.JWT_SECRET,
//         { expiresIn: '1d' }
//       );

//       user = await User.create({
//         name: 'Test User',
//         email: 'test@example.com',
//         password: await bcrypt.hash('Password123!', 10),
//         verificationToken,
//         verificationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000)
//       });
//     });

//     it('should verify email successfully', async () => {
//       const response = await agent
//         .get('/users/verify-email')
//         .query({ token: verificationToken });

//       expect(response.status).toBe(200);
//       expect(response.body.success).toBe(true);
//       expect(response.body.message).toContain('Email verified successfully');

//       const updatedUser = await User.findById(user._id);
//       expect(updatedUser.isVerified).toBe(true);
//     });

//     it('should handle expired verification token', async () => {
//       const expiredToken = jwt.sign(
//         { email: 'test@example.com' },
//         process.env.JWT_SECRET,
//         { expiresIn: '0s' }
//       );

//       await new Promise(resolve => setTimeout(resolve, 1000));

//       const response = await agent
//         .get('/users/verify-email')
//         .query({ token: expiredToken });

//       expect(response.status).toBe(400);
//       expect(response.body.success).toBe(false);
//       expect(response.body.message).toContain('verification failed');
//     });
//   });

//   describe('POST /users/request-password-reset', () => {
//     beforeEach(async () => {
//       await User.create({
//         name: 'Test User',
//         email: 'test@example.com',
//         password: await bcrypt.hash('Password123!', 10),
//         isVerified: true
//       });
//     });

//     it('should successfully request password reset', async () => {
//       const response = await agent
//         .post('/users/request-password-reset')
//         .send({ email: 'test@example.com' });

//       expect(response.status).toBe(200);
//       expect(response.body.message).toBe('Password reset email sent');

//       const user = await User.findOne({ email: 'test@example.com' });
//       expect(user.resetPasswordToken).toBeTruthy();
//       expect(user.resetPasswordExpires).toBeTruthy();
//       expect(user.resetPasswordExpires).toBeInstanceOf(Date);
//       expect(user.resetPasswordExpires.getTime()).toBeGreaterThan(Date.now());
//     });

//     it('should handle non-existent email', async () => {
//       const response = await agent
//         .post('/users/request-password-reset')
//         .send({ email: 'nonexistent@example.com' });

//       expect(response.status).toBe(404);
//       expect(response.body.message).toBe('User not found');
//     });
//   });

//   describe('POST /users/reset-password', () => {
//     let user;
//     let resetToken;
//     let hashedToken;

//     beforeEach(async () => {
//       const rawToken = crypto.randomBytes(20).toString('hex');
//       hashedToken = crypto
//         .createHash('sha256')
//         .update(rawToken)
//         .digest('hex');

//       user = await User.create({
//         name: 'Test User',
//         email: 'test@example.com',
//         password: await bcrypt.hash('oldpassword', 10),
//         resetPasswordToken: hashedToken,
//         resetPasswordExpires: new Date(Date.now() + 3600000)
//       });

//       resetToken = jwt.sign(
//         { id: user._id, resetToken: hashedToken },
//         process.env.JWT_SECRET,
//         { expiresIn: '1h' }
//       );
//     });

//     it('should successfully reset password', async () => {
//       const response = await agent
//         .post('/users/reset-password')
//         .query({ token: resetToken })
//         .send({
//           password: 'newpassword123',
//           confirmPassword: 'newpassword123'
//         });

//       expect(response.status).toBe(200);
//       expect(response.body.message).toBe('Password reset successful');

//       const updatedUser = await User.findById(user._id);
//       expect(updatedUser.resetPasswordToken).toBeUndefined();
//       expect(updatedUser.resetPasswordExpires).toBeUndefined();

//       const passwordValid = await bcrypt.compare('newpassword123', updatedUser.password);
//       expect(passwordValid).toBe(true);
//     });

//     it('should reject password reset with mismatched passwords', async () => {
//       const response = await agent
//         .post('/users/reset-password')
//         .query({ token: resetToken })
//         .send({
//           password: 'newpassword123',
//           confirmPassword: 'differentpassword'
//         });

//       expect(response.status).toBe(400);
//       expect(response.body.errors[0].msg).toBe('Passwords do not match');
//     });

//     it('should handle expired reset token', async () => {
//       const expiredToken = jwt.sign(
//         { id: user._id, resetToken: hashedToken },
//         process.env.JWT_SECRET,
//         { expiresIn: '0s' }
//       );

//       await new Promise(resolve => setTimeout(resolve, 1000));

//       const response = await agent
//         .post('/users/reset-password')
//         .query({ token: expiredToken })
//         .send({
//           password: 'newpassword123',
//           confirmPassword: 'newpassword123'
//         });

//       expect(response.status).toBe(400);
//       expect(response.body.message).toContain('expired');
//     });
//   });

//   describe('POST /users/resend-verification', () => {
//     beforeEach(async () => {
//       await User.create({
//         name: 'Test User',
//         email: 'test@example.com',
//         password: await bcrypt.hash('Password123!', 10),
//         isVerified: false
//       });
//     });

//     it('should resend verification email successfully', async () => {
//       const response = await agent
//         .post('/users/resend-verification')
//         .send({ email: 'test@example.com' });

//       expect(response.status).toBe(200);
//       expect(response.body.message).toBe('Verification email resent successfully');

//       const user = await User.findOne({ email: 'test@example.com' });
//       expect(user.verificationToken).toBeTruthy();
//       expect(user.verificationTokenExpires).toBeTruthy();
//     });

//     it('should handle already verified email', async () => {
//       await User.findOneAndUpdate(
//         { email: 'test@example.com' },
//         { isVerified: true }
//       );

//       const response = await agent
//         .post('/users/resend-verification')
//         .send({ email: 'test@example.com' });

//       expect(response.status).toBe(400);
//       expect(response.body.message).toBe('Email already verified');
//     });
//   });
// });



