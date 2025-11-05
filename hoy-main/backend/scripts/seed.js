// Seed sample data for RGA Dashboard
const dotenv = require('dotenv');
dotenv.config();
const bcrypt = require('bcrypt');
const db = require('../utils/db');

async function ensureClient(name, email, phone) {
    const [rows] = await db.execute('SELECT id FROM clients WHERE name = ?', [name]);
    if (rows.length > 0) return rows[0].id;
    const [res] = await db.execute('INSERT INTO clients (name, email, phone) VALUES (?, ?, ?)', [name, email, phone]);
    return res.insertId;
}

async function ensureUser({ clientId, name, email, password, role }) {
    const [rows] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (rows.length > 0) return rows[0].id;
    const password_hash = await bcrypt.hash(password, 10);
    const [res] = await db.execute(
        'INSERT INTO users (client_id, name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?, "active")',
        [clientId, name, email, password_hash, role]
    );
    return res.insertId;
}

async function main() {
    try {
        const clientId = await ensureClient('Demo Client', 'demo@example.com', '');
        const adminId = await ensureUser({ clientId, name: 'Admin', email: 'admin@example.com', password: 'admin123', role: 'admin' });

        // minimal demo data
        await db.execute(
            'INSERT INTO products (client_id, name, description, stock_quantity, price) VALUES (?, ?, ?, ?, ?)',
            [clientId, 'Sample Product', 'Demo item', 10, 199.00]
        ).catch(() => {});

        await db.execute(
            'INSERT INTO ad_metrics (client_id, campaign, channel, clicks, impressions, conversions, cost) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [clientId, 'Launch', 'Google Ads', 120, 5000, 12, 340.50]
        ).catch(() => {});

        await db.execute(
            'INSERT INTO seo_metrics (client_id, keyword, position, traffic, conversions) VALUES (?, ?, ?, ?, ?)',
            [clientId, 'best product', 5, 1200, 8]
        ).catch(() => {});

        await db.execute(
            'INSERT INTO alerts (client_id, metric, alert_condition, threshold, is_triggered) VALUES (?, ?, ?, ?, 0)',
            [clientId, 'conversions', '<', 5]
        ).catch(() => {});

        console.log('Seed completed. Admin login: admin@example.com / admin123');
        process.exit(0);
    } catch (e) {
        console.error('Seed failed:', e.message);
        process.exit(1);
    }
}

main();





