// Read-only public endpoints for demo purposes (no auth)
const express = require('express');
const router = express.Router();
const db = require('../utils/db');

router.get('/clients', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT id, name, email, phone, created_at FROM clients');
        res.json(rows);
    } catch (e) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.get('/products', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT id, client_id, name, description, stock_quantity, price, created_at FROM products');
        res.json(rows);
    } catch (e) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.get('/orders', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT id, client_id, customer_name, total_amount, status, created_at FROM orders ORDER BY created_at DESC');
        res.json(rows);
    } catch (e) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.get('/alerts', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT id, client_id, metric, alert_condition, threshold, is_triggered, created_at FROM alerts ORDER BY created_at DESC');
        res.json(rows);
    } catch (e) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.get('/uploads', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT id, client_id, filename, filepath, mimetype, size, uploaded_at FROM uploads ORDER BY uploaded_at DESC');
        res.json(rows);
    } catch (e) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.get('/ad-metrics/:clientId', async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT campaign, channel, clicks, impressions, conversions, cost, timestamp
             FROM ad_metrics WHERE client_id = ? ORDER BY timestamp DESC`,
            [req.params.clientId]
        );
        res.json(rows);
    } catch (e) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.get('/seo-metrics/:clientId', async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT keyword, position, traffic, conversions, date
             FROM seo_metrics WHERE client_id = ? ORDER BY date DESC`,
            [req.params.clientId]
        );
        res.json(rows);
    } catch (e) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

module.exports = router;





