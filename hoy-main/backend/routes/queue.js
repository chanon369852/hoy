const express = require('express');
const router = express.Router();
const queueController = require('../controllers/queueController');
const { authenticateToken } = require('../middleware/auth');

// Get latest queue number
router.get('/latest', authenticateToken, queueController.getLatestQueue);

// Get online users count
router.get('/online-users', authenticateToken, queueController.getOnlineUsers);

module.exports = router;
