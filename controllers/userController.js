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
        from: 'Tremendo Support <support@tremendo.pro>',
        to: email,
        subject: 'Verify Your Email - Tremendo',
        html: `
          <p>Thank you for registering. Please verify your email address.</p>
          <p><a href="${verificationLink}">Click here to verify your email</a></p>
          <p>Or copy this link: ${verificationLink}</p>
          <p>This verification link will expire in 24 hours.</p>
          <p>Need help? Contact support@tremendo.pro</p>
        `,
        text: `
        Thank you for registering. Please verify your email address.
        
        Click here to verify your email: ${verificationLink}
        
        This verification link will expire in 24 hours.
        
        Need help? Contact support@tremendo.pro
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
      from: 'Tremndo Support <support@tremendo.pro>',
      to: email,
      subject: 'Verify Your Email - Tremendo',
      html: `
        <p>You requested a new verification link for your account.</p>
        <p><a href="${verificationLink}">Click here to verify your email</a></p>
        <p>Or copy this link: ${verificationLink}</p>
        <p>This verification link will expire in 24 hours.</p>
        <p>Need help? Contact support@tremendo.pro</p>
      `,
      text: `
      You requested a new verification link for your account.

      Click here to verify your email: ${verificationLink}

      This verification link will expire in 24 hours.

      Need help? Contact support@tremendo.pro
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
      
      // Generate access token (1 hour for production)
      const accessToken = jwt.sign(
        { id: user._id }, 
        process.env.JWT_SECRET, 
        { expiresIn: process.env.NODE_ENV === 'development' ? '1d' : '1h' }
      );

      // Generate refresh token
      const refreshToken = jwt.sign(
        { id: user._id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.NODE_ENV === 'development' ? '7d' : '7d' }
      );

      // Save refresh token to user
      user.refreshToken = refreshToken;
      await user.save();

      res.json({
        accessToken,
        refreshToken,
        user: {  
          id: user._id,
          name: user.name,
          email: user.email
        } 
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  })
];


exports.refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token required' });
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    
    // Find user with this refresh token
    const user = await User.findOne({ 
      _id: decoded.id,
      refreshToken: refreshToken
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    // Generate new access token
    const accessToken = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET,
      { expiresIn: process.env.NODE_ENV === 'development' ? '30s' : '1h' }
    );

    res.json({ accessToken });
  } catch (error) {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
});


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

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${jwtToken}`;

    try {
      await resend.emails.send({
        from: 'Tremendo Support <support@tremendo.pro>',
        to: email,
        subject: 'Password Reset - Tremendo',
        html: `
          <p>You requested to reset your password.</p>
          <p><a href="${resetLink}">Click here to reset your password</a></p>
          <p>Or copy this link: ${resetLink}</p>
          <p>This link will expire in 1 hour.</p>
          <p>Need help? Contact support@tremendo.pro</p>
        `,
        text: `
        You requested to reset your password.

        Click here to reset your password: ${resetLink}

        This link will expire in 1 hour.

        Need help? Contact support@tremendo.pro
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
  const { refreshToken } = req.body;
  
  if (refreshToken) {
    // Find user with this refresh token and remove it
    await User.findOneAndUpdate(
      { refreshToken },
      { refreshToken: null }
    );
  }
  
  res.json({ message: 'Logged out successfully' });
});


