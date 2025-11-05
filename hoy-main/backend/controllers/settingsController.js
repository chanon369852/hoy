// ** controllers/settingsController.js **
const pool = require('../utils/db');

exports.getSettings = async (req, res) => {
  const clientId = req.user.client_id;
  try {
    const [rows] = await pool.execute(
      'SELECT refresh_interval_sec, kpi_targets_json, thresholds_json FROM settings WHERE client_id = ? LIMIT 1',
      [clientId]
    );
    if (rows.length === 0) {
      return res.json({
        status: 'success',
        data: { refresh_interval_sec: 300, kpi_targets_json: null, thresholds_json: null }
      });
    }
    res.json({ status: 'success', data: rows[0] });
  } catch (err) {
    console.error('Get settings error:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.updateSettings = async (req, res) => {
  const clientId = req.user.client_id;
  const { refresh_interval_sec = 300, kpi_targets, thresholds } = req.body;
  try {
    const [existing] = await pool.execute('SELECT id FROM settings WHERE client_id = ? LIMIT 1', [clientId]);
    if (existing.length > 0) {
      await pool.execute(
        'UPDATE settings SET refresh_interval_sec = ?, kpi_targets_json = ?, thresholds_json = ?, updated_at = NOW() WHERE client_id = ?',
        [refresh_interval_sec, JSON.stringify(kpi_targets || null), JSON.stringify(thresholds || null), clientId]
      );
    } else {
      await pool.execute(
        'INSERT INTO settings (client_id, refresh_interval_sec, kpi_targets_json, thresholds_json) VALUES (?, ?, ?, ?)',
        [clientId, refresh_interval_sec, JSON.stringify(kpi_targets || null), JSON.stringify(thresholds || null)]
      );
    }
    res.json({ status: 'success' });
  } catch (err) {
    console.error('Update settings error:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
