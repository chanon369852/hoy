// ** routes/seo.js **
const express = require('express');
const router = express.Router();
const seoController = require('../controllers/seoController'); // ชี้ไปที่ seoController.js
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.get('/:clientId', authenticateToken, seoController.getMetricsByClientId);
router.post('/', authenticateToken, authorizeRole(['admin', 'manager']), seoController.createSeoMetric);

module.exports = router;