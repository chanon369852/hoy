// ** routes/auth.js **
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Register with email verification
router.post('/register', authController.register);

// Verify email
router.get('/verify/:token', authController.verifyEmail);

// Resend verification email
router.post('/resend-verification', authController.resendVerification);

// Login (check if email is verified)
router.post('/login', authController.login);

module.exports = router;
