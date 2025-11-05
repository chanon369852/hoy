// ** controllers/ecommerceController.js **
// E-commerce Controller - Shopee, Lazada, Shopify integration
const pool = require('../utils/db');

// Get E-commerce Sales Summary
exports.getSalesSummary = async (req, res) => {
  const { client_id, role } = req.user;
  const { startDate, endDate, platform } = req.query;

  try {
    let clientFilter = '';
    let clientParams = [];
    if (role !== 'admin' && role !== 'manager' && role !== 'superadmin') {
      clientFilter = 'AND client_id = ?';
      clientParams = [client_id];
    }

    const dateFilter = startDate && endDate 
      ? `AND DATE(created_at) BETWEEN ? AND ?`
      : `AND DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`;
    const dateParams = startDate && endDate ? [startDate, endDate] : [];

    // Get sales data from orders table (can be enhanced with platform field)
    const [salesData] = await pool.execute(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as order_count,
        SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END) as revenue,
        AVG(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END) as avg_order_value
      FROM orders 
      WHERE 1=1 ${clientFilter} ${dateFilter}
      GROUP BY DATE(created_at)
      ORDER BY date DESC`,
      [...clientParams, ...dateParams]
    );

    // Get product performance
    const [productData] = await pool.execute(
      `SELECT 
        p.name,
        p.price,
        SUM(oi.quantity) as units_sold,
        SUM(oi.quantity * oi.price) as revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN products p ON oi.product_id = p.id
      WHERE o.status = 'paid' ${clientFilter.replace('client_id', 'o.client_id')} ${dateFilter.replace('created_at', 'o.created_at')}
      GROUP BY p.id, p.name, p.price
      ORDER BY revenue DESC
      LIMIT 20`,
      [...clientParams, ...dateParams]
    );

    // Get stock status
    const [stockData] = await pool.execute(
      `SELECT 
        name,
        stock_quantity,
        price,
        CASE 
          WHEN stock_quantity = 0 THEN 'out_of_stock'
          WHEN stock_quantity < 10 THEN 'low_stock'
          ELSE 'in_stock'
        END as stock_status
      FROM products 
      WHERE 1=1 ${clientFilter}
      ORDER BY stock_quantity ASC`,
      clientParams
    );

    res.json({
      success: true,
      data: {
        sales: salesData,
        topProducts: productData,
        stock: stockData
      }
    });

  } catch (error) {
    console.error('Error fetching e-commerce sales:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// Get Cart Analytics (if available)
exports.getCartAnalytics = async (req, res) => {
  const { client_id, role } = req.user;

  try {
    // This would typically come from e-commerce platform APIs
    // For now, return mock/structure data
    res.json({
      success: true,
      data: {
        cartAbandonmentRate: 0,
        averageCartValue: 0,
        totalCarts: 0,
        convertedCarts: 0,
        message: 'Cart analytics will be available when integrated with e-commerce platform APIs'
      }
    });

  } catch (error) {
    console.error('Error fetching cart analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

