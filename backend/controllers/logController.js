// ** controllers/logController.js **
const db = require('../utils/db');

// ดึง Audit Logs ทั้งหมด (Admin เท่านั้น)
exports.getAllLogs = async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT al.id, al.user_id, al.action, al.description, al.created_at, u.email AS user_email 
             FROM audit_logs al
             LEFT JOIN users u ON al.user_id = u.id
             ORDER BY al.created_at DESC`
        );
        res.json(rows);
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};