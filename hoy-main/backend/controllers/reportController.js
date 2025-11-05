// ** controllers/reportController.js **
// Report Controller - Export functionality and detailed reports
const pool = require('../utils/db');

// Get Detailed Report Data
exports.getDetailedReport = async (req, res) => {
  const { client_id, role } = req.user;
  const { 
    startDate, 
    endDate, 
    channel, 
    campaign,
    format = 'json' 
  } = req.query;

  try {
    let clientFilter = '';
    let clientParams = [];
    if (role !== 'admin' && role !== 'manager' && role !== 'superadmin') {
      clientFilter = 'AND client_id = ?';
      clientParams = [client_id];
    }

    const dateFilter = startDate && endDate 
      ? `AND DATE(timestamp) BETWEEN ? AND ?`
      : `AND DATE(timestamp) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`;
    const dateParams = startDate && endDate ? [startDate, endDate] : [];

    let channelFilter = '';
    if (channel) {
      channelFilter = 'AND channel = ?';
      clientParams.push(channel);
    }

    let campaignFilter = '';
    if (campaign) {
      campaignFilter = 'AND campaign = ?';
      clientParams.push(campaign);
    }

    const [reportData] = await pool.execute(
      `SELECT 
        DATE(timestamp) as date,
        channel,
        campaign,
        SUM(clicks) as clicks,
        SUM(impressions) as impressions,
        SUM(conversions) as conversions,
        SUM(cost) as cost,
        AVG(CASE WHEN impressions > 0 THEN clicks / impressions * 100 ELSE 0 END) as ctr,
        AVG(CASE WHEN impressions > 0 THEN cost / impressions * 1000 ELSE 0 END) as cpm,
        AVG(CASE WHEN clicks > 0 THEN conversions / clicks * 100 ELSE 0 END) as conversion_rate,
        AVG(CASE WHEN conversions > 0 THEN cost / conversions ELSE 0 END) as cpa
      FROM ad_metrics 
      WHERE 1=1 ${clientFilter} ${channelFilter} ${campaignFilter} ${dateFilter}
      GROUP BY DATE(timestamp), channel, campaign
      ORDER BY date DESC, cost DESC`,
      [...clientParams, ...dateParams]
    );

    // Get summary
    const [summary] = await pool.execute(
      `SELECT 
        SUM(clicks) as total_clicks,
        SUM(impressions) as total_impressions,
        SUM(conversions) as total_conversions,
        SUM(cost) as total_cost
      FROM ad_metrics 
      WHERE 1=1 ${clientFilter} ${channelFilter} ${campaignFilter} ${dateFilter}`,
      [...clientParams, ...dateParams]
    );

    const totalCost = parseFloat(summary[0]?.total_cost || 0);
    const totalRevenue = 0; // Can be joined with orders table if needed

    res.json({
      success: true,
      data: reportData,
      summary: {
        ...summary[0],
        roi: totalCost > 0 ? ((totalRevenue - totalCost) / totalCost * 100).toFixed(2) : 0,
        roas: totalCost > 0 ? (totalRevenue / totalCost).toFixed(2) : 0
      },
      filters: {
        startDate: startDate || null,
        endDate: endDate || null,
        channel: channel || null,
        campaign: campaign || null
      }
    });

  } catch (error) {
    console.error('Error generating detailed report:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// Export to CSV
exports.exportCSV = async (req, res) => {
  const { client_id, role } = req.user;
  const { startDate, endDate, channel, campaign } = req.query;

  try {
    let clientFilter = '';
    let clientParams = [];
    if (role !== 'admin' && role !== 'manager' && role !== 'superadmin') {
      clientFilter = 'AND client_id = ?';
      clientParams = [client_id];
    }

    const dateFilter = startDate && endDate 
      ? `AND DATE(timestamp) BETWEEN ? AND ?`
      : `AND DATE(timestamp) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`;
    const dateParams = startDate && endDate ? [startDate, endDate] : [];

    let channelFilter = channel ? 'AND channel = ?' : '';
    if (channel) clientParams.push(channel);

    let campaignFilter = campaign ? 'AND campaign = ?' : '';
    if (campaign) clientParams.push(campaign);

    const [reportData] = await pool.execute(
      `SELECT 
        DATE(timestamp) as date,
        channel,
        campaign,
        SUM(clicks) as clicks,
        SUM(impressions) as impressions,
        SUM(conversions) as conversions,
        SUM(cost) as cost
      FROM ad_metrics 
      WHERE 1=1 ${clientFilter} ${channelFilter} ${campaignFilter} ${dateFilter}
      GROUP BY DATE(timestamp), channel, campaign
      ORDER BY date DESC`,
      [...clientParams, ...dateParams]
    );

    // Convert to CSV
    const headers = ['Date', 'Channel', 'Campaign', 'Clicks', 'Impressions', 'Conversions', 'Cost'];
    const csvRows = [headers.join(',')];

    reportData.forEach(row => {
      csvRows.push([
        row.date,
        row.channel || '',
        row.campaign || '',
        row.clicks || 0,
        row.impressions || 0,
        row.conversions || 0,
        row.cost || 0
      ].join(','));
    });

    const csv = csvRows.join('\n');
    const filename = `report_${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\ufeff' + csv); // BOM for UTF-8

  } catch (error) {
    console.error('Error exporting CSV:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

