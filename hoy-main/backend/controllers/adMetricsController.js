// ** controllers/adMetricsController.js **

// ✅ แก้ไข Path การนำเข้า DB: ต้องใช้ '../utils/db'
const db = require('../utils/db'); 

// --------------------------------------------------
// 1. ดึง Ad Metrics ตาม Client ID ที่ระบุ (getMetricsByClientId)
// --------------------------------------------------
exports.getMetricsByClientId = async (req, res) => {
    const { clientId } = req.params;
    const { role, client_id } = req.user; 

    // Authorization Check: Admin/Manager หรือ Viewer ที่ดู client_id ของตัวเองเท่านั้น
    if (role !== 'admin' && role !== 'manager' && client_id != clientId) {
        return res.status(403).json({ message: 'Access denied. You can only view metrics for your associated client.' });
    }

    try {
        const [rows] = await db.execute(
            `SELECT campaign, channel, clicks, impressions, conversions, cost, timestamp 
             FROM ad_metrics 
             WHERE client_id = ? 
             ORDER BY timestamp DESC`, 
            [clientId]
        );
        res.json(rows);
    } catch (error) {
        console.error('Error fetching ad metrics:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// --------------------------------------------------
// 2. บันทึก Ad Metrics ใหม่ (createAdMetrics)
// --------------------------------------------------
exports.createAdMetrics = async (req, res) => {
    const { client_id, campaign, channel, clicks, impressions, conversions, cost } = req.body;
    
    try {
        const [result] = await db.execute(
            `INSERT INTO ad_metrics (client_id, campaign, channel, clicks, impressions, conversions, cost) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [client_id, campaign, channel, clicks || 0, impressions || 0, conversions || 0, cost || 0.00]
        );
        res.status(201).json({ id: result.insertId, client_id, campaign });
    } catch (error) {
        console.error('Error creating ad metrics:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};