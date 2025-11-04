// ** controllers/seoController.js **
const db = require('../utils/db');

// ดึง SEO metrics ตาม clientId (สอดคล้อง schema: keyword, position, traffic, conversions, date)
exports.getMetricsByClientId = async (req, res) => {
    const { clientId } = req.params;
    const { role, client_id } = req.user || {};

    if (role !== 'admin' && role !== 'manager' && client_id != clientId) {
        return res.status(403).json({ message: 'Access denied. You can only view metrics for your associated client.' });
    }

    try {
        const [rows] = await db.execute(
            `SELECT keyword, position, traffic, conversions, date
             FROM seo_metrics 
             WHERE client_id = ? 
             ORDER BY date DESC`,
            [clientId]
        );
        res.json(rows);
    } catch (error) {
        console.error('Error fetching SEO metrics:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// บันทึก SEO metric ใหม่
exports.createSeoMetric = async (req, res) => {
    const { client_id, keyword, position, traffic, conversions, date } = req.body;

    if (!client_id || !keyword) {
        return res.status(400).json({ message: 'Missing client_id or keyword.' });
    }

    try {
        const [result] = await db.execute(
            `INSERT INTO seo_metrics (client_id, keyword, position, traffic, conversions, date) 
             VALUES (?, ?, ?, ?, ?, COALESCE(?, CURDATE()))`,
            [client_id, keyword, position || null, traffic || null, conversions || null, date || null]
        );
        res.status(201).json({ id: result.insertId, client_id, keyword });
    } catch (error) {
        console.error('Error creating SEO metric:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};



