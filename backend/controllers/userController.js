// ** controllers/userController.js **
const db = require('../utils/db'); 
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// ดึงรายการผู้ใช้ทั้งหมด (Admin เท่านั้น)
exports.getAllUsers = async (req, res) => {
    // Authorization Check อยู่ใน route แล้ว (authorizeRole(['admin']))

    try {
        const [rows] = await db.execute('SELECT id, name, email, role, client_id, created_at FROM users');
        // ไม่ส่ง password_hash กลับไป
        res.json(rows);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// สร้างผู้ใช้ใหม่ (Admin เท่านั้น)
exports.createUser = async (req, res) => {
    const { name, email, password, role, client_id } = req.body;

    if (!name || !email || !password || !role) {
        return res.status(400).json({ message: 'Missing required fields.' });
    }
    
    try {
        const password_hash = await bcrypt.hash(password, 10);

        const [result] = await db.execute(
            `INSERT INTO users (name, email, password_hash, role, client_id) 
             VALUES (?, ?, ?, ?, ?)`,
            [name, email, password_hash, role, client_id || null]
        );
        
        res.status(201).json({ 
            id: result.insertId, 
            name, 
            email, 
            role, 
            client_id 
        });
    } catch (error) {
        console.error('Error creating user:', error);
        // ตรวจจับ Duplicate Entry Error (ถ้ามี Unique constraint ใน DB)
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Email already exists.' });
        }
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
// exports.updateUser, ฯลฯ...