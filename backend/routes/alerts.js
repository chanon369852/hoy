// ** routes/alerts.js **
const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// ดึงรายการ Alerts ทั้งหมด (ตามสิทธิ์ผู้ใช้)
router.get('/', authenticateToken, alertController.getAllAlerts);

// สร้าง Alert ใหม่ (Admin/Manager เท่านั้น)
router.post('/', authenticateToken, authorizeRole(['admin', 'manager']), alertController.createAlert);

module.exports = router;