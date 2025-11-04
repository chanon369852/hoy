// ** routes/users.js **
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// ดึงรายการผู้ใช้ทั้งหมด (Admin เท่านั้น)
router.get('/', authenticateToken, authorizeRole(['admin']), userController.getAllUsers);

// สร้างผู้ใช้ใหม่ (Admin เท่านั้น)
router.post('/', authenticateToken, authorizeRole(['admin']), userController.createUser);

// router.put('/:id', authenticateToken, authorizeRole(['admin']), userController.updateUser); 

module.exports = router;