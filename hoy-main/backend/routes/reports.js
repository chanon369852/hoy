// ** routes/reports.js **
const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Get Detailed Report
router.get('/detailed', reportController.getDetailedReport);

// Export CSV
router.get('/export/csv', reportController.exportCSV);

module.exports = router;



