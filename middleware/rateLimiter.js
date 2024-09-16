const rateLimit = require('express-rate-limit');

// Define rate limiting rule
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many accounts created from this IP, please try again after 15 minutes',
});

module.exports = registerLimiter;