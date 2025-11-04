// ** controllers/authController.js **
const db = require('../utils/db');
const bcrypt = require('bcrypt'); // ใช้ bcrypt ที่ติดตั้งแล้ว
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

exports.login = async (req, res) => {
    const { email, password } = req.body;
    
    try {
        const [rows] = await db.execute('SELECT id, client_id, name, email, password_hash, role FROM users WHERE email = ?', [email]);
        const user = rows[0];

        if (!user) return res.status(401).json({ message: 'Invalid credentials (User not found).' });

        const isPasswordValid = await bcrypt.compare(password, user.password_hash || '');
        if (!isPasswordValid) return res.status(401).json({ message: 'Invalid credentials (Password mismatch).' });

        const tokenPayload = { id: user.id, client_id: user.client_id, role: user.role, email: user.email };
        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '12h' }); 

        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, client_id: user.client_id } });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
};

// สมัครสมาชิกใหม่ แล้วออก token ให้ทันที
exports.register = async (req, res) => {
    const { name, email, password, client_name } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        // ตรวจว่ามีผู้ใช้งานซ้ำ
        const [existing] = await db.execute('SELECT id, client_id, name, email, password_hash, role FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            // หากอีเมลมีอยู่แล้ว และรหัสผ่านถูกต้อง ให้ล็อกอินให้เลย (ประสบการณ์ผู้ใช้ที่ดีขึ้น)
            const user = existing[0];
            const ok = await bcrypt.compare(password, user.password_hash || '');
            if (ok) {
                const token = jwt.sign({ id: user.id, client_id: user.client_id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '12h' });
                return res.status(200).json({ token, user: { id: user.id, client_id: user.client_id, role: user.role, email: user.email, name: user.name } });
            }
            return res.status(409).json({ message: 'Email already exists.' });
        }

        // สร้าง client (ถ้ามี client_name) หรือปล่อยให้เป็น NULL
        let clientId = null;
        if (client_name && client_name.trim()) {
            const [clientRes] = await db.execute(
                'INSERT INTO clients (name, email, phone) VALUES (?, ?, ?)',
                [client_name.trim(), null, null]
            );
            clientId = clientRes.insertId;
        }

        const password_hash = await bcrypt.hash(password, 10);
        const [userRes] = await db.execute(
            'INSERT INTO users (client_id, name, email, password_hash, role, status) VALUES (?, ?, ?, ?, "viewer", "active")',
            [clientId, name || null, email, password_hash]
        );

        const user = { id: userRes.insertId, client_id: clientId, role: 'viewer', email, name: name || null };
        const token = jwt.sign({ id: user.id, client_id: user.client_id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '12h' });

        res.status(201).json({ token, user });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Server error during registration.' });
    }
};