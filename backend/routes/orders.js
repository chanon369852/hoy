// ** routes/orders.js **
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// ดึงรายการคำสั่งซื้อทั้งหมด (พร้อม items, ตามสิทธิ์ผู้ใช้)
router.get('/', authenticateToken, orderController.getAllOrders);

// สร้างคำสั่งซื้อใหม่ (Admin/Manager เท่านั้น)
router.post('/', authenticateToken, authorizeRole(['admin', 'manager']), orderController.createOrder);

// router.put('/:id/status', authenticateToken, authorizeRole(['admin', 'manager']), orderController.updateOrderStatus); 

module.exports = router;