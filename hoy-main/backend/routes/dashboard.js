const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const pool = require('../utils/db');

// All routes require authentication
router.use(authenticateToken);

// Dashboard summary endpoint
router.get('/', (req, res) => {
    res.json({
        status: 'success',
        message: 'Dashboard data fetched successfully',
        data: {
            // Add your dashboard data structure here
            stats: {
                totalUsers: 0,
                totalProducts: 0,
                totalOrders: 0,
                totalRevenue: 0
            },
            recentActivity: []
        }
    });

// List campaigns for filter
router.get('/campaigns', async (req, res) => {
    const { client_id, role } = req.user;
    const { provider } = req.query;
    try {
        const where = [];
        const params = [];
        if (role !== 'superadmin') { where.push('client_id = ?'); params.push(client_id); }
        if (provider) { where.push('provider = ?'); params.push(provider); }
        const whereSql = where.length ? ('WHERE ' + where.join(' AND ')) : '';
        const [rows] = await pool.execute(
            `SELECT id, name, provider FROM campaigns ${whereSql} ORDER BY name ASC`,
            params
        );
        res.json({ status: 'success', data: rows });
    } catch (err) {
        console.error('Dashboard campaigns error:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Export CSV/XLSX for metrics_daily
router.get('/export', async (req, res) => {
    const { client_id, role } = req.user;
    const { from, to, provider, campaign_id, type = 'csv' } = req.query;
    try {
        const where = [];
        const params = [];
        if (role !== 'superadmin') { where.push('client_id = ?'); params.push(client_id); }
        if (provider) { where.push('provider = ?'); params.push(provider); }
        if (campaign_id) { where.push('campaign_id = ?'); params.push(campaign_id); }
        if (from && to) { where.push('date BETWEEN ? AND ?'); params.push(from, to); }
        const whereSql = where.length ? ('WHERE ' + where.join(' AND ')) : '';

        const [rows] = await pool.execute(
            `SELECT date, provider, campaign_id, impressions, clicks, cost, conversions, revenue 
             FROM metrics_daily ${whereSql} ORDER BY date ASC`,
            params
        );

        // Simple CSV export (works with Excel as well)
        const header = ['date','provider','campaign_id','impressions','clicks','cost','conversions','revenue'];
        const csv = [header.join(',')].concat(
            rows.map(r => [r.date, r.provider, r.campaign_id, r.impressions, r.clicks, r.cost, r.conversions, r.revenue].join(','))
        ).join('\n');

        const filename = `export_${Date.now()}.${type === 'xlsx' ? 'xlsx' : 'csv'}`;
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', type === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv; charset=utf-8');
        // Note: xlsx type will still send CSV content as a lightweight fallback
        res.send(csv);
    } catch (err) {
        console.error('Dashboard export error:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});
});

// Summary metrics (totals + quick trend)
router.get('/summary', async (req, res) => {
    const { client_id, role } = req.user;
    const { from, to, provider, campaign_id } = req.query;

    try {
        const where = [];
        const params = [];

        if (role !== 'superadmin') {
            where.push('client_id = ?');
            params.push(client_id);
        }

        if (provider) {
            where.push('provider = ?');
            params.push(provider);
        }

        if (campaign_id) {
            where.push('campaign_id = ?');
            params.push(campaign_id);
        }

        if (from && to) {
            where.push('date BETWEEN ? AND ?');
            params.push(from, to);
        } else {
            where.push('date >= CURDATE() - INTERVAL 6 DAY');
        }

        const whereSql = where.length ? ('WHERE ' + where.join(' AND ')) : '';

        const [totalsRows] = await pool.execute(
            `SELECT 
                COALESCE(SUM(impressions),0) AS impressions,
                COALESCE(SUM(clicks),0) AS clicks,
                COALESCE(SUM(cost),0) AS cost,
                COALESCE(SUM(conversions),0) AS conversions,
                COALESCE(SUM(revenue),0) AS revenue
             FROM metrics_daily
             ${whereSql}`,
            params
        );

        const [trendRows] = await pool.execute(
            `SELECT date, 
                    SUM(impressions) AS impressions, 
                    SUM(clicks) AS clicks, 
                    SUM(cost) AS cost, 
                    SUM(conversions) AS conversions, 
                    SUM(revenue) AS revenue
             FROM metrics_daily
             ${whereSql}
             GROUP BY date
             ORDER BY date ASC`,
            params
        );

        const totals = totalsRows[0] || { impressions:0, clicks:0, cost:0, conversions:0, revenue:0 };
        const ctr = totals.impressions > 0 ? totals.clicks / totals.impressions : 0;
        const cpm = totals.impressions > 0 ? (totals.cost * 1000) / totals.impressions : 0;
        const cpc = totals.clicks > 0 ? totals.cost / totals.clicks : 0;
        const cpa = totals.conversions > 0 ? totals.cost / totals.conversions : 0;
        const roas = totals.cost > 0 ? totals.revenue / totals.cost : 0;

        res.json({
            status: 'success',
            data: {
                totals: { ...totals, ctr, cpm, cpc, cpa, roas },
                trend: trendRows
            }
        });
    } catch (err) {
        console.error('Dashboard summary error:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Trend endpoint (daily or hourly)
router.get('/trend', async (req, res) => {
    const { client_id, role } = req.user;
    const { from, to, provider, campaign_id, interval = 'daily' } = req.query;

    try {
        const where = [];
        const params = [];

        if (role !== 'superadmin') {
            where.push('client_id = ?');
            params.push(client_id);
        }

        if (provider) { where.push('provider = ?'); params.push(provider); }
        if (campaign_id) { where.push('campaign_id = ?'); params.push(campaign_id); }

        let table = 'metrics_daily';
        let timeField = 'date';
        if (interval === 'hourly') {
            table = 'metrics_hourly';
            timeField = 'ts';
        }

        if (from && to) {
            where.push(`${timeField} BETWEEN ? AND ?`);
            params.push(from, to);
        } else {
            where.push(`${timeField} >= (CASE WHEN '${interval}'='hourly' THEN NOW() - INTERVAL 24 HOUR ELSE CURDATE() - INTERVAL 6 DAY END)`);
        }

        const whereSql = where.length ? ('WHERE ' + where.join(' AND ')) : '';

        let groupBy = timeField;
        if (interval === 'hourly') {
            groupBy = 'DATE_FORMAT(ts, "%Y-%m-%d %H:00:00")';
        }

        const [rows] = await pool.execute(
            `SELECT ${interval === 'hourly' ? groupBy + ' AS bucket' : 'date AS bucket'},
                    SUM(impressions) AS impressions,
                    SUM(clicks) AS clicks,
                    SUM(cost) AS cost,
                    SUM(conversions) AS conversions,
                    SUM(revenue) AS revenue
             FROM ${table}
             ${whereSql}
             GROUP BY ${interval === 'hourly' ? groupBy : 'date'}
             ORDER BY ${interval === 'hourly' ? 'bucket' : 'date'} ASC`,
            params
        );

        res.json({ status: 'success', data: rows });
    } catch (err) {
        console.error('Dashboard trend error:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

module.exports = router;