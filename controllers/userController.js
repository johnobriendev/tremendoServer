const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const axios = require('axios');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// get user data
exports.getUserData = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password'); // Ensure you're excluding sensitive data
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

    const { name, email, password } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });//changed from username to email
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
      
    }

    const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1d' });

    // Create new user
    const user = await User.create({
      name,
      email,
      password: await bcrypt.hash(password, 10),
      verificationToken,
      verificationTokenExpires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    });

    try {
      // Send verification email
      await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: email,
        subject: 'Verify Your Email',
        html: `Please click <a href="${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}">here</a> to verify your email. This link will expire in 24 hours.`
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

// User registration
// exports.registerUser =[
  
//   // Validation and sanitization
//   body('name').optional().isString().trim().escape(),
//   body('email').isEmail().withMessage('Please enter a valid email').normalizeEmail(),
//   body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
//   body('g-recaptcha-response').not().isEmpty().withMessage('reCAPTCHA is required'),

//   asyncHandler(async (req, res) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({ errors: errors.array() });
//     }
  
//     const { name, email, password, 'g-recaptcha-response': recaptchaToken } = req.body;

//     // Verify reCAPTCHA with Google
//     const secretKey = process.env.RECAPTCHA_SECRET_KEY;
//     const recaptchaVerifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${recaptchaToken}`;
    
//     try {
//       const recaptchaResponse = await axios.post(recaptchaVerifyUrl);
//       const { success } = recaptchaResponse.data;
      
//       if (!success) {
//         return res.status(400).json({ message: 'Failed reCAPTCHA verification' });
//       }

//       // Check if user already exists
//       const userExists = await User.findOne({ email });//changed from username to email
//       if (userExists) {
//         res.status(400).json({ message: 'User already exists' });
//         return;
//       }

//       // Create new user
//       const user = await User.create({
//         name,
//         email,
//         password: await bcrypt.hash(password, 10),
//       });

//       res.status(201).json({
//         _id: user._id,
//         name: user.name,
//         email: user.email,
//       });
//     } catch (error) {
//     return res.status(500).json({ message: 'reCAPTCHA verification failed' });
//     }
//   })
// ];

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
        // user: {  
        //   id: user._id,
        //   name: user.name,
        //   email: user.email
        // } //not sure if this should be included
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
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

// User logout
exports.logoutUser = asyncHandler(async (req, res) => {
  res.status(200).json({ message: 'Logout successful' });
});