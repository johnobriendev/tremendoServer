const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const axios = require('axios');

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
  body('email').isEmail().withMessage('Please enter a valid email').normalizeEmail(),
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
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password: await bcrypt.hash(password, 10),
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
    });
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
  body('email').isEmail().withMessage('Please enter a valid email').normalizeEmail(),
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
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: '1h',
      });
      res.json({
        token,
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  })
];

// User logout
exports.logoutUser = asyncHandler(async (req, res) => {
  res.status(200).json({ message: 'Logout successful' });
});