// ** routes/dataIntegration.js **
const express = require('express');
const router = express.Router();
const dataIntegrationController = require('../controllers/dataIntegrationController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Sync all platforms (Admin/Manager/SuperAdmin only)
router.post('/sync', authorizeRole(['admin', 'manager', 'superadmin']), dataIntegrationController.syncAllPlatforms);

// Get sync status
router.get('/status', dataIntegrationController.getSyncStatus);

module.exports = router;


