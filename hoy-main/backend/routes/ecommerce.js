// ** routes/ecommerce.js **
const express = require('express');
const router = express.Router();
const ecommerceController = require('../controllers/ecommerceController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Sales Summary
router.get('/sales', ecommerceController.getSalesSummary);

// Cart Analytics
router.get('/cart', ecommerceController.getCartAnalytics);

module.exports = router;



