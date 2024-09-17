var express = require('express');
var router = express.Router();
const userController = require('../controllers/userController');
const { authenticateJWT } = require('../middleware/auth');
const registerLimiter = require('../middleware/rateLimiter');


router.post('/register', registerLimiter, userController.registerUser);
router.post('/login', userController.loginUser);
router.post('/logout', userController.logoutUser);
router.get('/verify-email', userController.verifyEmail);
router.get('/', authenticateJWT, userController.getUserData);

module.exports = router;