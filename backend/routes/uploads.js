// ** routes/uploads.js **
const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
// *ในโค้ดจริงต้องเพิ่ม Multer สำหรับการจัดการไฟล์*
// const upload = require('../middleware/multer'); 

// ดึงรายการไฟล์ที่อัปโหลดทั้งหมด (ตามสิทธิ์ผู้ใช้)
router.get('/', authenticateToken, uploadController.getAllUploads);

// บันทึกการอัปโหลดลง DB (Admin/Manager เท่านั้น)
// *เพิ่ม middleware Multer ตรงนี้: upload.single('file'),*
router.post('/', authenticateToken, authorizeRole(['admin', 'manager']), uploadController.recordUpload);

module.exports = router;

