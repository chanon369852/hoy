// ** controllers/alertController.js **
const db = require('../utils/db'); 

// ดึงการแจ้งเตือนทั้งหมด (ตามสิทธิ์ผู้ใช้) — สอดคล้อง schema: metric, alert_condition, threshold, is_triggered, created_at
exports.getAllAlerts = async (req, res) => {
    const { role, client_id } = req.user;

    let query = `SELECT id, client_id, metric, alert_condition, threshold, is_triggered, created_at FROM alerts`;
    const params = [];

    if (role === 'viewer') {
        query += ' WHERE client_id = ?';
        params.push(client_id);
    }
    
    query += ' ORDER BY created_at DESC';

    try {
        const [alerts] = await db.execute(query, params);
        res.json(alerts);
    } catch (error) {
        console.error('Error fetching alerts:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// สร้างการแจ้งเตือนใหม่ (Admin/Manager เท่านั้น)
exports.createAlert = async (req, res) => {
    const { client_id, metric, alert_condition, threshold } = req.body; 

    if (!client_id || !metric || !alert_condition || typeof threshold === 'undefined') {
        return res.status(400).json({ message: 'Missing client_id, metric, alert_condition, or threshold.' });
    }
    
    try {
        const [result] = await db.execute(
            `INSERT INTO alerts (client_id, metric, alert_condition, threshold, is_triggered) 
             VALUES (?, ?, ?, ?, 0)`,
            [client_id, metric, alert_condition, threshold]
        );
        
        res.status(201).json({ 
            id: result.insertId, 
            message: 'Alert created successfully'
        });
    } catch (error) {
        console.error('Error creating alert:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// ... exports.markAsRead, exports.deleteAlert ฯลฯ