// ** controllers/alertController.js **
const db = require('../utils/db'); 

// GET /api/alerts
exports.getAllAlerts = async (req, res) => {
    const { role, client_id } = req.user;

    let query = `SELECT id, client_id, rule_name, dimension, condition_json, status, triggered_at, created_at
                 FROM alerts`;
    const params = [];

    if (role !== 'superadmin') {
        query += ' WHERE client_id = ?';
        params.push(client_id);
    }
    
    query += ' ORDER BY created_at DESC';

    try {
        const [alerts] = await db.execute(query, params);
        res.json({ status: 'success', data: alerts });
    } catch (error) {
        console.error('Error fetching alerts:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// POST /api/alerts (Admin/Manager)
exports.createAlert = async (req, res) => {
    const { rule_name, dimension = 'global', condition } = req.body; 
    const clientId = req.user.client_id;

    if (!rule_name || !condition) {
        return res.status(400).json({ message: 'Missing rule_name or condition.' });
    }
    
    try {
        const [result] = await db.execute(
            `INSERT INTO alerts (client_id, rule_name, dimension, condition_json, status) 
             VALUES (?, ?, ?, ?, 'active')`,
            [clientId, rule_name, dimension, JSON.stringify(condition)]
        );
        
        res.status(201).json({ 
            status: 'success',
            id: result.insertId
        });
    } catch (error) {
        console.error('Error creating alert:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// PUT /api/alerts/:id  { status: 'active'|'resolved' }
exports.updateAlertStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const { role, client_id } = req.user;

    if (!['active','resolved'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    try {
        const where = [];
        const params = [status];
        let sql = `UPDATE alerts SET status = ? WHERE id = ?`;
        params.push(id);

        if (role !== 'superadmin') {
            sql += ' AND client_id = ?';
            params.push(client_id);
        }

        const [result] = await db.execute(sql, params);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Alert not found' });
        }
        res.json({ status: 'success' });
    } catch (error) {
        console.error('Error updating alert:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};