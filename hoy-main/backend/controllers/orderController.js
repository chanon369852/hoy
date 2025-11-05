// ** controllers/orderController.js **
const db = require('../utils/db'); 

// ดึงรายการคำสั่งซื้อทั้งหมด (พร้อม items, ตามสิทธิ์ผู้ใช้)
exports.getAllOrders = async (req, res) => {
    const { role, client_id } = req.user;

    let query = 'SELECT o.id, o.client_id, o.status, o.total_amount, o.order_date FROM orders o';
    const params = [];

    // ถ้าไม่ใช่ Admin หรือ Manager ให้แสดงเฉพาะ Order ของ Client นั้น
    if (role === 'viewer') {
        query += ' WHERE o.client_id = ?';
        params.push(client_id);
    }
    
    query += ' ORDER BY o.order_date DESC';

    try {
        const [orders] = await db.execute(query, params);
        
        // *ในระบบจริง ควรดึง order_items มาผูกกับแต่ละ order ด้วย Query เพิ่มเติม*

        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// สร้างคำสั่งซื้อใหม่ (Admin/Manager เท่านั้น)
exports.createOrder = async (req, res) => {
    // Logic ที่ซับซ้อนกว่านี้สำหรับการจัดการ Transaction ของ orders และ order_items
    const { client_id, total_amount, items } = req.body; 

    if (!client_id || !total_amount || !items || items.length === 0) {
        return res.status(400).json({ message: 'Missing client_id, total_amount, or items.' });
    }
    
    // *ในระบบจริง: ต้องใช้ Transaction*

    try {
        const [result] = await db.execute(
            `INSERT INTO orders (client_id, total_amount, status) 
             VALUES (?, ?, 'pending')`,
            [client_id, total_amount]
        );
        
        res.status(201).json({ 
            order_id: result.insertId, 
            message: "Order created successfully (Items not yet inserted)."
        });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};