// ** routes/logs.js **
const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// ดึง Audit Logs ทั้งหมด (Admin เท่านั้น)
router.get('/', authenticateToken, authorizeRole(['admin']), logController.getAllLogs);

// ไม่มี POST/PUT/DELETE เพราะ Logs ควรถูกบันทึกโดยระบบโดยอัตโนมัติ

module.exports = router;