// ** routes/adMetricsRoutes.js **
const express = require('express');
const router = express.Router();
// ❌ ลบบรรทัดนี้ออก (Route ไม่ควรเข้าถึง DB โดยตรง)
// const db = require('../db'); 

// ✅ นำเข้า Controller ที่มี Logic การเข้าถึง DB
const adMetricsController = require('../controllers/adMetricsController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// ดึงข้อมูล Ad Metrics สำหรับ client_id ที่ระบุ
router.get('/:clientId', authenticateToken, adMetricsController.getMetricsByClientId);

// เพิ่มข้อมูล Ad Metrics ใหม่
router.post('/', authenticateToken, authorizeRole(['admin', 'manager']), adMetricsController.createAdMetrics);

module.exports = router;