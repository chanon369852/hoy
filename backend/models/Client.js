const BaseModel = require('./BaseModel');

class Client extends BaseModel {
  constructor() {
    super('clients');
  }

  // Get client with their orders
  async getClientWithOrders(clientId) {
    try {
      const [rows] = await pool.query(
        `SELECT c.*, o.id as order_id, o.customer_name, o.total_amount, o.status as order_status, o.created_at as order_date
         FROM clients c
         LEFT JOIN orders o ON c.id = o.client_id
         WHERE c.id = ?
         ORDER BY o.created_at DESC`,
        [clientId]
      );

      if (rows.length === 0) {
        return null;
      }

      // Group orders by client
      const result = {
        id: rows[0].id,
        name: rows[0].name,
        email: rows[0].email,
        phone: rows[0].phone,
        created_at: rows[0].created_at,
        orders: []
      };

      // Add orders if they exist
      if (rows[0].order_id) {
        result.orders = rows.map(row => ({
          id: row.order_id,
          customer_name: row.customer_name,
          total_amount: row.total_amount,
          status: row.order_status,
          created_at: row.order_date
        }));
      }

      return result;
    } catch (error) {
      console.error('Error in getClientWithOrders:', error);
      throw error;
    }
  }

  // Get client stats (order count, total spent, etc.)
  async getClientStats(clientId) {
    try {
      const [result] = await pool.query(
        `SELECT 
          COUNT(o.id) as total_orders,
          SUM(CASE WHEN o.status = 'paid' THEN o.total_amount ELSE 0 END) as total_spent,
          COUNT(DISTINCT DATE(o.created_at)) as active_days
         FROM clients c
         LEFT JOIN orders o ON c.id = o.client_id
         WHERE c.id = ?
         GROUP BY c.id`,
        [clientId]
      );

      return result[0] || {
        total_orders: 0,
        total_spent: 0,
        active_days: 0
      };
    } catch (error) {
      console.error('Error in getClientStats:', error);
      throw error;
    }
  }
}

// Create a singleton instance
const clientModel = new Client();

module.exports = clientModel;
