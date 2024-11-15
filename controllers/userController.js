const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const axios = require('axios');
const { Resend } = require('resend');
const crypto = require('crypto');

const resend = new Resend(process.env.RESEND_API_KEY);

// get user data
exports.getUserData = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password'); 
    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user data' });
  }
});

// User registration
exports.registerUser =[
  
  // Validation and sanitization
  body('name').optional().isString().trim().escape(),
  body('email').isEmail().withMessage('Please enter a valid email'), // take off .normalizeEmail() to allow periods
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),

  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, recaptchaToken } = req.body;

    // Verify reCAPTCHA
    try {
      const recaptchaResponse = await axios.post(
        `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`
      );
      
      if (!recaptchaResponse.data.success) {
        return res.status(400).json({ message: 'reCAPTCHA verification failed' });
      }
    } catch (error) {
      return res.status(500).json({ message: 'reCAPTCHA verification error' });
    }


    // Check if user already exists
    const userExists = await User.findOne({ email });//changed from username to email
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
      
    }

    const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1d' });
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    // Create new user
    const user = await User.create({
      name,
      email,
      password: await bcrypt.hash(password, 10),
      verificationToken,
      verificationTokenExpires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    });

    try {
      await resend.emails.send({
        from: 'support@tremendo.pro',
        to: email,
        subject: 'Verify Your Email - Tremendo',
        html: `
          <h2>Welcome to Tremendo!</h2>
          <p>Thank you for registering. To complete your account setup, please verify your email address.</p>
          
          <p><strong>Click the button below to verify your email:</strong></p>
          <a href="${verificationLink}" style="background-color: #4CAF50; color: white; padding: 14px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Verify Email</a>
          
          <p>If the button above doesn't work, you can copy and paste this link into your browser:</p>
          <p style="background-color: #f5f5f5; padding: 10px; border-radius: 4px; word-break: break-all;">
            ${verificationLink}
          </p>
          
          <p><em>This verification link will expire in 24 hours.</em></p>
          
          <p>If you didn't create an account with Tremendo, please ignore this email.</p>
          
          <p>Need help? Contact our support team at support@tremendo.pro</p>
        `
      });


      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        message: 'Registration successful. Please check your email to verify your account.',
      });
    } catch (error) {
      // If email sending fails, delete the created user
      await User.findByIdAndDelete(user._id);
      return res.status(500).json({ message: 'Registration failed. Unable to send verification email.' });
    }
  })
];


// Email verification
exports.verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.query;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ email: decoded.email, verificationToken: token });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification token' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: true, message: 'Email already verified' });
    }

    user.isVerified = true;
    // user.verificationToken = undefined;  //take these out so the front end can see if the token has been verified
    // user.verificationTokenExpires = undefined; //if the tokens are deleted the FE sees no token and throws error even though the verification was successful
    await user.save();

    res.status(200).json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Email verification failed', error: error.message });
  }
});


exports.resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (user.isVerified) {
    return res.status(400).json({ message: 'Email already verified' });
  }

  // Generate a new verification token
  const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1d' });
  const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

  
  user.verificationToken = verificationToken;
  user.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  await user.save();

  try {
    await resend.emails.send({
      from: 'support@tremendo.pro',
      to: email,
      subject: 'Verify Your Email - Tremendo',
      html: `
        <h2>Email Verification Reminder</h2>
        <p>You recently requested a new verification link for your Tremendo account.</p>
        
        <p><strong>Click the button below to verify your email:</strong></p>
        <a href="${verificationLink}" style="background-color: #4CAF50; color: white; padding: 14px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Verify Email</a>
        
        <p>If the button above doesn't work, you can copy and paste this link into your browser:</p>
        <p style="background-color: #f5f5f5; padding: 10px; border-radius: 4px; word-break: break-all;">
          ${verificationLink}
        </p>
        
        <p><em>This verification link will expire in 24 hours.</em></p>
        
        <p>If you didn't request this verification email, please ignore it or contact our support team.</p>
        
        <p>Need help? Contact our support team at support@tremendo.pro</p>
      `
    });

    res.status(200).json({ message: 'Verification email resent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to resend verification email' });
  }
});


// User login
exports.loginUser = [
  // Validation and sanitization
  body('email').isEmail().withMessage('Please enter a valid email'), //.normalizeEmail(), allow periods in emails
  body('password').notEmpty().withMessage('Password is required'),

  // Controller logic
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (user && (await bcrypt.compare(password, user.password))) {
      if (!user.isVerified) {
        return res.status(401).json({ message: 'Please verify your email before logging in' });
      }
      
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: '1h',
      });
      res.json({
        token,
        user: {  
          id: user._id,
          name: user.name,
          email: user.email
        } //not sure if this should be included
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  })
];


exports.requestPasswordReset = [
  body('email').isEmail().withMessage('Please enter a valid email'),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate a unique reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    
    // Hash the reset token before saving it to the database
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // console.log('User after save:', user);

    // Create a JWT that includes the user's ID and the hashed reset token
    const jwtToken = jwt.sign(
      { 
        id: user._id,
        resetToken: hashedToken
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // console.log('Generated reset token:', resetToken);
    // console.log('Hashed reset token:', hashedToken);
    // console.log('JWT token:', jwtToken);
    // console.log('Reset token expiry:', new Date(user.resetPasswordExpires));

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${jwtToken}`;

    try {
      await resend.emails.send({
        from: 'support@tremendo.pro',
        to: email,
        subject: 'Password Reset - Tremendo',
        html: `
          <h2>Password Reset Request</h2>
          <p>You recently requested to reset your password for your Tremendo account.</p>
          
          <p><strong>Click the button below to reset your password:</strong></p>
          <a href="${resetLink}" style="background-color: #4CAF50; color: white; padding: 14px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
          
          <p>If the button above doesn't work, you can copy and paste this link into your browser:</p>
          <p style="background-color: #f5f5f5; padding: 10px; border-radius: 4px; word-break: break-all;">
            ${resetLink}
          </p>
          
          <p><em>This password reset link will expire in 1 hour.</em></p>
          
          <p>If you did not request a password reset, please ignore this email or contact our support team if you have concerns.</p>
          
          <p>Need help? Contact our support team at support@tremendo.pro</p>
        `
      });
      res.status(200).json({ message: 'Password reset email sent' });
    } catch (error) {
      console.error('Error sending reset email:', error);
      res.status(500).json({ message: 'Failed to send password reset email' });
    }
  })
];

// Reset password
exports.resetPassword = [
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Passwords do not match');
    }
    return true;
  }),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token } = req.query;
    const { password } = req.body;

    try {
      console.log('Received token:', token);

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Decoded token:', decoded);
      const user = await User.findOne({
        _id: decoded.id,
        resetPasswordToken: decoded.resetToken,
        resetPasswordExpires: { $gt: Date.now() }
      });

      console.log('User found:', user ? user._id : 'No user found');

      if (!user) {
        console.log('Reset password token check failed');
        console.log('Current time:', new Date());
        console.log('Token expiry:', new Date(decoded.exp * 1000));
        return res.status(400).json({ message: 'Invalid or expired reset token' });
      }

      user.password = await bcrypt.hash(password, 10);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
      console.error('Password reset error:', error);
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(400).json({ message: 'Invalid token', error: error.message });
      }
      if (error instanceof jwt.TokenExpiredError) {
        return res.status(400).json({ message: 'Token expired', error: error.message });
      }
      res.status(400).json({ message: 'Password reset failed', error: error.message });
    }
  })
];

// User logout
exports.logoutUser = asyncHandler(async (req, res) => {
  res.status(200).json({ message: 'Logout successful' });
});


