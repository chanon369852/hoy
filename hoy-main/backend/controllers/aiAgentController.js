// ** controllers/aiAgentController.js **
// AI Agent Controller - Natural Language Query, Insights, Recommendations
const pool = require('../utils/db');

// Natural Language Query Handler
exports.naturalLanguageQuery = async (req, res) => {
  const { query } = req.body;
  const { client_id, role } = req.user;

  try {
    // Simple keyword-based query parsing (can be enhanced with NLP)
    const queryLower = query.toLowerCase();
    
    let clientFilter = '';
    let clientParams = [];
    if (role !== 'admin' && role !== 'manager' && role !== 'superadmin') {
      clientFilter = 'AND client_id = ?';
      clientParams = [client_id];
    }

    // Parse query keywords
    if (queryLower.includes('ยอดขาย') || queryLower.includes('revenue') || queryLower.includes('sales')) {
      const [result] = await pool.execute(
        `SELECT 
          SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END) as total_revenue,
          COUNT(*) as total_orders
        FROM orders 
        WHERE 1=1 ${clientFilter}
        AND DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`,
        clientParams
      );

      return res.json({
        success: true,
        query,
        answer: `ยอดขายรวม 30 วันล่าสุด: ${parseFloat(result[0]?.total_revenue || 0).toLocaleString('th-TH')} บาท จาก ${result[0]?.total_orders || 0} คำสั่งซื้อ`,
        data: result[0]
      });
    }

    if (queryLower.includes('คลิก') || queryLower.includes('click')) {
      const [result] = await pool.execute(
        `SELECT SUM(clicks) as total_clicks
        FROM ad_metrics 
        WHERE 1=1 ${clientFilter}
        AND DATE(timestamp) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`,
        clientParams
      );

      return res.json({
        success: true,
        query,
        answer: `จำนวนคลิก 7 วันล่าสุด: ${result[0]?.total_clicks || 0} คลิก`,
        data: result[0]
      });
    }

    if (queryLower.includes('ctr') || queryLower.includes('อัตราคลิก')) {
      const [result] = await pool.execute(
        `SELECT 
          AVG(CASE WHEN impressions > 0 THEN clicks / impressions * 100 ELSE 0 END) as avg_ctr
        FROM ad_metrics 
        WHERE 1=1 ${clientFilter}
        AND DATE(timestamp) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`,
        clientParams
      );

      return res.json({
        success: true,
        query,
        answer: `CTR เฉลี่ย 7 วันล่าสุด: ${parseFloat(result[0]?.avg_ctr || 0).toFixed(2)}%`,
        data: result[0]
      });
    }

    if (queryLower.includes('roi') || queryLower.includes('roas')) {
      const [adCost] = await pool.execute(
        `SELECT SUM(cost) as total_cost
        FROM ad_metrics 
        WHERE 1=1 ${clientFilter}
        AND DATE(timestamp) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`,
        clientParams
      );

      const [revenue] = await pool.execute(
        `SELECT SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END) as total_revenue
        FROM orders 
        WHERE 1=1 ${clientFilter}
        AND DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`,
        clientParams
      );

      const cost = parseFloat(adCost[0]?.total_cost || 0);
      const rev = parseFloat(revenue[0]?.total_revenue || 0);
      const roi = cost > 0 ? ((rev - cost) / cost) * 100 : 0;
      const roas = cost > 0 ? rev / cost : 0;

      return res.json({
        success: true,
        query,
        answer: `ROI: ${roi.toFixed(2)}%, ROAS: ${roas.toFixed(2)}x (30 วันล่าสุด)`,
        data: { roi, roas, cost, revenue: rev }
      });
    }

    // Default response
    res.json({
      success: false,
      query,
      answer: 'ขออภัย ไม่สามารถเข้าใจคำถามได้ กรุณาลองถามใหม่ เช่น "ยอดขายเดือนนี้เท่าไร" หรือ "CTR เป็นเท่าไร"',
      suggestions: [
        'ยอดขายเดือนนี้เท่าไร',
        'จำนวนคลิก 7 วันล่าสุด',
        'CTR เป็นเท่าไร',
        'ROI และ ROAS เป็นเท่าไร',
        'แคมเปญไหนทำงานดีที่สุด'
      ]
    });

  } catch (error) {
    console.error('Error processing natural language query:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการประมวลผลคำถาม'
    });
  }
};

// Generate Insights
exports.generateInsights = async (req, res) => {
  const { client_id, role } = req.user;
  const { period = 30 } = req.query;

  try {
    let clientFilter = '';
    let clientParams = [];
    if (role !== 'admin' && role !== 'manager' && role !== 'superadmin') {
      clientFilter = 'AND client_id = ?';
      clientParams = [client_id];
    }

    // Get current period metrics
    const [currentMetrics] = await pool.execute(
      `SELECT 
        SUM(clicks) as clicks,
        SUM(impressions) as impressions,
        SUM(conversions) as conversions,
        SUM(cost) as cost
      FROM ad_metrics 
      WHERE DATE(timestamp) >= DATE_SUB(CURDATE(), INTERVAL ? DAY) ${clientFilter}`,
      [parseInt(period), ...clientParams]
    );

    // Get previous period metrics
    const [previousMetrics] = await pool.execute(
      `SELECT 
        SUM(clicks) as clicks,
        SUM(impressions) as impressions,
        SUM(conversions) as conversions,
        SUM(cost) as cost
      FROM ad_metrics 
      WHERE DATE(timestamp) >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      AND DATE(timestamp) < DATE_SUB(CURDATE(), INTERVAL ? DAY) ${clientFilter}`,
      [parseInt(period) * 2, parseInt(period), ...clientParams]
    );

    const current = currentMetrics[0] || {};
    const previous = previousMetrics[0] || {};

    // Calculate changes
    const clicksChange = previous.clicks > 0 
      ? ((current.clicks - previous.clicks) / previous.clicks * 100).toFixed(1)
      : 0;
    const conversionsChange = previous.conversions > 0
      ? ((current.conversions - previous.conversions) / previous.conversions * 100).toFixed(1)
      : 0;
    const costChange = previous.cost > 0
      ? ((current.cost - previous.cost) / previous.cost * 100).toFixed(1)
      : 0;

    // Generate insights
    const insights = [];

    if (parseFloat(clicksChange) > 10) {
      insights.push({
        type: 'positive',
        title: 'จำนวนคลิกเพิ่มขึ้น',
        message: `จำนวนคลิกเพิ่มขึ้น ${clicksChange}% จากช่วงก่อนหน้า`,
        metric: 'clicks',
        change: clicksChange
      });
    } else if (parseFloat(clicksChange) < -10) {
      insights.push({
        type: 'warning',
        title: 'จำนวนคลิกลดลง',
        message: `จำนวนคลิกลดลง ${Math.abs(clicksChange)}% จากช่วงก่อนหน้า ควรตรวจสอบ`,
        metric: 'clicks',
        change: clicksChange
      });
    }

    if (parseFloat(conversionsChange) > 10) {
      insights.push({
        type: 'positive',
        title: 'Conversion เพิ่มขึ้น',
        message: `Conversion เพิ่มขึ้น ${conversionsChange}% จากช่วงก่อนหน้า`,
        metric: 'conversions',
        change: conversionsChange
      });
    }

    if (parseFloat(costChange) > 20 && parseFloat(clicksChange) < 10) {
      insights.push({
        type: 'warning',
        title: 'ค่าใช้จ่ายเพิ่มขึ้นโดยไม่สมส่วน',
        message: `ค่าใช้จ่ายเพิ่มขึ้น ${costChange}% แต่จำนวนคลิกเพิ่มเพียง ${clicksChange}%`,
        metric: 'cost',
        change: costChange
      });
    }

    // Get best performing channel
    const [bestChannel] = await pool.execute(
      `SELECT channel, SUM(conversions) as conversions
      FROM ad_metrics 
      WHERE DATE(timestamp) >= DATE_SUB(CURDATE(), INTERVAL ? DAY) ${clientFilter}
      GROUP BY channel
      ORDER BY conversions DESC
      LIMIT 1`,
      [parseInt(period), ...clientParams]
    );

    if (bestChannel[0]) {
      insights.push({
        type: 'info',
        title: 'ช่องทางที่ทำงานดีที่สุด',
        message: `ช่องทาง ${bestChannel[0].channel} มี conversion สูงสุด`,
        metric: 'channel',
        data: bestChannel[0]
      });
    }

    res.json({
      success: true,
      insights,
      metrics: {
        current: current,
        previous: previous,
        changes: {
          clicks: clicksChange,
          conversions: conversionsChange,
          cost: costChange
        }
      }
    });

  } catch (error) {
    console.error('Error generating insights:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการสร้าง insights'
    });
  }
};

// Anomaly Detection
exports.detectAnomalies = async (req, res) => {
  const { client_id, role } = req.user;
  const { threshold = 20 } = req.query; // Percentage threshold

  try {
    let clientFilter = '';
    let clientParams = [];
    if (role !== 'admin' && role !== 'manager' && role !== 'superadmin') {
      clientFilter = 'AND client_id = ?';
      clientParams = [client_id];
    }

    // Get daily metrics for last 7 days
    const [dailyMetrics] = await pool.execute(
      `SELECT 
        DATE(timestamp) as date,
        SUM(clicks) as clicks,
        SUM(impressions) as impressions,
        SUM(conversions) as conversions,
        SUM(cost) as cost
      FROM ad_metrics 
      WHERE DATE(timestamp) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) ${clientFilter}
      GROUP BY DATE(timestamp)
      ORDER BY date DESC`,
      clientParams
    );

    if (dailyMetrics.length < 2) {
      return res.json({
        success: true,
        anomalies: [],
        message: 'ข้อมูลไม่เพียงพอสำหรับการตรวจสอบความผิดปกติ'
      });
    }

    // Calculate average
    const avgClicks = dailyMetrics.reduce((sum, m) => sum + (m.clicks || 0), 0) / dailyMetrics.length;
    const avgCost = dailyMetrics.reduce((sum, m) => sum + parseFloat(m.cost || 0), 0) / dailyMetrics.length;
    const avgConversions = dailyMetrics.reduce((sum, m) => sum + (m.conversions || 0), 0) / dailyMetrics.length;

    const anomalies = [];

    dailyMetrics.forEach((metric, index) => {
      if (index === 0) return; // Skip today

      const clicksDeviation = ((metric.clicks - avgClicks) / avgClicks * 100);
      const costDeviation = ((parseFloat(metric.cost) - avgCost) / avgCost * 100);
      const conversionsDeviation = ((metric.conversions - avgConversions) / avgConversions * 100);

      if (Math.abs(clicksDeviation) > threshold) {
        anomalies.push({
          date: metric.date,
          type: clicksDeviation > 0 ? 'high' : 'low',
          metric: 'clicks',
          value: metric.clicks,
          average: avgClicks,
          deviation: clicksDeviation.toFixed(1),
          message: `จำนวนคลิก ${clicksDeviation > 0 ? 'สูง' : 'ต่ำ'}ผิดปกติ ${Math.abs(clicksDeviation).toFixed(1)}%`
        });
      }

      if (Math.abs(costDeviation) > threshold) {
        anomalies.push({
          date: metric.date,
          type: costDeviation > 0 ? 'high' : 'low',
          metric: 'cost',
          value: parseFloat(metric.cost),
          average: avgCost,
          deviation: costDeviation.toFixed(1),
          message: `ค่าใช้จ่าย ${costDeviation > 0 ? 'สูง' : 'ต่ำ'}ผิดปกติ ${Math.abs(costDeviation).toFixed(1)}%`
        });
      }

      if (Math.abs(conversionsDeviation) > threshold && conversionsDeviation < -threshold) {
        anomalies.push({
          date: metric.date,
          type: 'low',
          metric: 'conversions',
          value: metric.conversions,
          average: avgConversions,
          deviation: conversionsDeviation.toFixed(1),
          message: `Conversion ${conversionsDeviation < 0 ? 'ลดลง' : 'เพิ่มขึ้น'}ผิดปกติ ${Math.abs(conversionsDeviation).toFixed(1)}%`
        });
      }
    });

    res.json({
      success: true,
      anomalies,
      threshold
    });

  } catch (error) {
    console.error('Error detecting anomalies:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการตรวจสอบความผิดปกติ'
    });
  }
};

// Get Recommendations
exports.getRecommendations = async (req, res) => {
  const { client_id, role } = req.user;

  try {
    let clientFilter = '';
    let clientParams = [];
    if (role !== 'admin' && role !== 'manager' && role !== 'superadmin') {
      clientFilter = 'AND client_id = ?';
      clientParams = [client_id];
    }

    const recommendations = [];

    // Check CTR performance
    const [ctrMetrics] = await pool.execute(
      `SELECT 
        channel,
        AVG(CASE WHEN impressions > 0 THEN clicks / impressions * 100 ELSE 0 END) as ctr
      FROM ad_metrics 
      WHERE DATE(timestamp) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) ${clientFilter}
      GROUP BY channel
      HAVING ctr < 1.0`,
      clientParams
    );

    ctrMetrics.forEach(channel => {
      recommendations.push({
        type: 'optimization',
        priority: 'medium',
        title: 'ปรับปรุง CTR',
        message: `CTR ของช่องทาง ${channel.channel} ต่ำกว่า 1% ควรปรับปรุง ad copy หรือ targeting`,
        action: 'review_ad_copy',
        channel: channel.channel
      });
    });

    // Check CPA performance
    const [cpaMetrics] = await pool.execute(
      `SELECT 
        channel,
        AVG(CASE WHEN conversions > 0 THEN cost / conversions ELSE 0 END) as cpa
      FROM ad_metrics 
      WHERE DATE(timestamp) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) ${clientFilter}
      GROUP BY channel
      HAVING cpa > 100`,
      clientParams
    );

    cpaMetrics.forEach(channel => {
      recommendations.push({
        type: 'cost',
        priority: 'high',
        title: 'CPA สูงเกินไป',
        message: `CPA ของช่องทาง ${channel.channel} สูงกว่า 100 บาท ควรทบทวนกลยุทธ์`,
        action: 'optimize_bidding',
        channel: channel.channel
      });
    });

    // Check budget allocation
    const [budgetAllocation] = await pool.execute(
      `SELECT 
        channel,
        SUM(cost) as total_cost,
        SUM(conversions) as total_conversions
      FROM ad_metrics 
      WHERE DATE(timestamp) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) ${clientFilter}
      GROUP BY channel
      ORDER BY total_cost DESC`,
      clientParams
    );

    if (budgetAllocation.length > 1) {
      const totalCost = budgetAllocation.reduce((sum, c) => sum + parseFloat(c.total_cost || 0), 0);
      const topChannel = budgetAllocation[0];
      const topChannelPercent = (parseFloat(topChannel.total_cost) / totalCost * 100);

      if (topChannelPercent > 70) {
        recommendations.push({
          type: 'strategy',
          priority: 'medium',
          title: 'กระจายงบโฆษณา',
          message: `งบส่วนใหญ่ (${topChannelPercent.toFixed(1)}%) อยู่ที่ช่องทาง ${topChannel.channel} ควรกระจายไปช่องทางอื่น`,
          action: 'diversify_budget',
          data: { topChannel: topChannel.channel, percentage: topChannelPercent }
        });
      }
    }

    res.json({
      success: true,
      recommendations
    });

  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการสร้างคำแนะนำ'
    });
  }
};

