const rateLimit = require('express-rate-limit');




const rateLimiter = {
  // Keep your existing register limiter
  register: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many accounts created from this IP, please try again after 15 minutes'
  }),

  // Add new API limiter
  api: rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 200,
    message: 'Too many requests, please try again later',
    keyGenerator: (req) => req.user?._id || req.ip
  }),
  emailOperations: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour window
    max: 10, // limit each IP/user to 10 email requests per hour
    message: 'Too many email requests. Please try again in an hour.',
    keyGenerator: (req) => req.user?._id || req.ip,
    standardHeaders: true,
    legacyHeaders: false
  })

};

module.exports = rateLimiter;

// Define rate limiting rule
// const registerLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 5, // Limit each IP to 5 requests per windowMs
//   message: 'Too many accounts created from this IP, please try again after 15 minutes',
// });

// module.exports = registerLimiter;

