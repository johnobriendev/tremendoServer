var express = require('express');
var router = express.Router();
const userController = require('../controllers/userController');
const { authenticateJWT } = require('../middleware/auth');
const registerLimiter = require('../middleware/rateLimiter');


router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);
router.post('/request-password-reset', userController.requestPasswordReset);
router.post('/reset-password', userController.resetPassword);
router.post('/logout', userController.logoutUser);
router.get('/verify-email', userController.verifyEmail);
router.post('/resend-verification', userController.resendVerification);
router.get('/', authenticateJWT, userController.getUserData);

module.exports = router;