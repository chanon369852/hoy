// ** controllers/dataIntegrationController.js **
// Data Integration Controller - Sync data from external platforms
const dataIntegrationService = require('../services/dataIntegrationService');
const pool = require('../utils/db');

// Sync data from all platforms
exports.syncAllPlatforms = async (req, res) => {
  const { client_id, role } = req.user;
  const { startDate, endDate } = req.body;

  try {
    // Only admin/manager/superadmin can sync for all clients
    const targetClientId = role === 'admin' || role === 'manager' || role === 'superadmin'
      ? req.body.clientId || client_id 
      : client_id;

    const syncResult = await dataIntegrationService.syncAllPlatforms(
      targetClientId,
      startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate || new Date().toISOString()
    );

    // Save synced data to database
    if (syncResult.success) {
      // Process each platform's data
      for (const [platform, result] of Object.entries(syncResult.platforms)) {
        if (result.success && result.data && result.data.length > 0) {
          const transformedData = dataIntegrationService.transformToAdMetrics(
            result.data,
            platform,
            targetClientId
          );

          // Insert into ad_metrics table
          for (const metric of transformedData) {
            try {
              await pool.execute(
                `INSERT INTO ad_metrics (client_id, campaign, channel, clicks, impressions, conversions, cost, timestamp)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                   clicks = clicks + VALUES(clicks),
                   impressions = impressions + VALUES(impressions),
                   conversions = conversions + VALUES(conversions),
                   cost = cost + VALUES(cost)`,
                [
                  metric.client_id,
                  metric.campaign,
                  metric.channel,
                  metric.clicks,
                  metric.impressions,
                  metric.conversions,
                  metric.cost,
                  metric.timestamp
                ]
              );
            } catch (error) {
              console.error(`Error inserting ${platform} data:`, error);
            }
          }
        }
      }
    }

    res.json({
      success: true,
      message: 'Data sync completed',
      result: syncResult
    });

  } catch (error) {
    console.error('Error syncing platforms:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// Get sync status
exports.getSyncStatus = async (req, res) => {
  const { client_id, role } = req.user;

  try {
    let clientFilter = '';
    let clientParams = [];
    if (role !== 'admin' && role !== 'manager' && role !== 'superadmin') {
      clientFilter = 'AND client_id = ?';
      clientParams = [client_id];
    }

    // Get last sync time for each channel
    const [lastSync] = await pool.execute(
      `SELECT 
        channel,
        MAX(timestamp) as last_sync,
        COUNT(*) as total_records
      FROM ad_metrics 
      WHERE 1=1 ${clientFilter}
      GROUP BY channel`,
      clientParams
    );

    res.json({
      success: true,
      data: lastSync
    });

  } catch (error) {
    console.error('Error fetching sync status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

