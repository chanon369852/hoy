const db = require('../utils/db');

// Get latest queue number
exports.getLatestQueue = async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT queue_number FROM queue ORDER BY created_at DESC LIMIT 1'
    );
    
    const latestQueue = rows[0]?.queue_number || 0;
    
    res.json({
      success: true,
      queueNumber: latestQueue
    });
  } catch (error) {
    console.error('Error fetching latest queue:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch latest queue'
    });
  }
};

// Get online users count
exports.getOnlineUsers = async (req, res) => {
  try {
    // This is a simplified example - in a real app, you'd track active sessions
    const [rows] = await db.execute(
      'SELECT COUNT(DISTINCT user_id) as count FROM user_sessions WHERE last_activity > DATE_SUB(NOW(), INTERVAL 5 MINUTE)'
    );
    
    res.json({
      success: true,
      count: rows[0]?.count || 0
    });
  } catch (error) {
    console.error('Error fetching online users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch online users'
    });
  }
};
