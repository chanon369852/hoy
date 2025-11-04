// ** routes/auth.js **
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Route สำหรับการ Login
router.post('/login', authController.login);

// Route สำหรับสมัครสมาชิก
router.post('/register', authController.register);

module.exports = router;