// ** controllers/uploadController.js **
const db = require('../utils/db');
// *หมายเหตุ: ต้องใช้ Multer เพื่อจัดการไฟล์จริงในระบบ*

// ดึงรายการไฟล์ที่อัปโหลดทั้งหมด (ตามสิทธิ์ผู้ใช้)
exports.getAllUploads = async (req, res) => {
    const { role, client_id } = req.user;

    let query = 'SELECT id, client_id, filename, filepath, uploaded_at FROM uploads';
    let params = [];

    if (role === 'viewer' && client_id) {
        query += ' WHERE client_id = ?';
        params.push(client_id);
    }
    query += ' ORDER BY uploaded_at DESC';

    try {
        const [rows] = await db.execute(query, params);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching uploads:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// บันทึกการอัปโหลดลง DB (Admin/Manager เท่านั้น)
exports.recordUpload = async (req, res) => {
    // ในโค้ดจริง คุณจะใช้ req.body.client_id และ req.file (จาก Multer)
    const { client_id } = req.body;
    
    // ข้อมูลจำลอง
    const mockData = { filename: 'report.pdf', filepath: `/uploads/${client_id}/report.pdf`, mimetype: 'application/pdf', size: 10240 }; 

    try {
        const [result] = await db.execute(
            'INSERT INTO uploads (client_id, filename, filepath, mimetype, size) VALUES (?, ?, ?, ?, ?)',
            [client_id, mockData.filename, mockData.filepath, mockData.mimetype, mockData.size]
        );
        res.status(201).json({ id: result.insertId, message: 'File upload recorded successfully (Need Multer for actual file handling).' });
    } catch (error) {
        console.error('Error recording upload:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};