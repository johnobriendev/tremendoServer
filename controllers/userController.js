const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');

// User registration
exports.registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Check if user already exists
  const userExists = await User.findOne({ username });
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
});

// User login
exports.loginUser = asyncHandler(async (req, res) => {
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
});

// User logout
exports.logoutUser = asyncHandler(async (req, res) => {
  res.status(200).json({ message: 'Logout successful' });
});