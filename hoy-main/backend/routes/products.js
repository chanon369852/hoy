// ** routes/products.js **
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// ดึงสินค้าทั้งหมด (ตามสิทธิ์ผู้ใช้)
router.get('/', authenticateToken, productController.getAllProducts);

// นำเข้าสินค้าจาก API ภายนอก (Admin/Manager เท่านั้น)
router.post('/import', authenticateToken, authorizeRole(['admin', 'manager']), productController.importProductsFromExternalApi);

// สร้างสินค้าใหม่ (Admin/Manager เท่านั้น)
router.post('/', authenticateToken, authorizeRole(['admin', 'manager']), productController.createProduct);

// อัพเดทสินค้า (Admin/Manager เท่านั้น)
router.put('/:id', authenticateToken, authorizeRole(['admin', 'manager']), productController.updateProduct);

// ลบสินค้า (Admin/Manager เท่านั้น)
router.delete('/:id', authenticateToken, authorizeRole(['admin', 'manager']), productController.deleteProduct);

module.exports = router;