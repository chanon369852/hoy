// ** controllers/productController.js **
const db = require('../utils/db'); 

// ดึงรายการสินค้าทั้งหมด (ตามสิทธิ์ผู้ใช้)
exports.getAllProducts = async (req, res) => {
    // การอนุญาตสิทธิ์จะจัดการใน Route (authenticateToken)

    try {
        const { role, client_id } = req.user;
        let query = 'SELECT id, client_id, name, description, price, stock_quantity FROM products';
        const params = [];
        if (role === 'viewer') {
            query += ' WHERE client_id = ?';
            params.push(client_id);
        }
        const [rows] = await db.execute(query, params);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// สร้างสินค้าใหม่ (Admin/Manager เท่านั้น)
exports.createProduct = async (req, res) => {
    const { client_id, name, description, price, stock_quantity } = req.body;

    if (!client_id || !name || !price) {
        return res.status(400).json({ message: 'Missing required fields (client_id, name, price).' });
    }
    
    try {
        const [result] = await db.execute(
            `INSERT INTO products (client_id, name, description, price, stock_quantity) 
             VALUES (?, ?, ?, ?, ?)`,
            [client_id, name, description || null, price, stock_quantity || 0]
        );
        
        res.status(201).json({ 
            id: result.insertId, 
            client_id,
            name, 
            price 
        });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.updateProduct = async (req, res) => {
    const { id } = req.params;
    const { client_id, name, description, price, stock_quantity } = req.body;

    if (!name || !price) {
        return res.status(400).json({ message: 'Missing required fields (name, price).' });
    }

    try {
        await db.execute(
            `UPDATE products SET client_id = ?, name = ?, description = ?, price = ?, stock_quantity = ? WHERE id = ?`,
            [client_id, name, description || null, price, stock_quantity || 0, id]
        );
        res.json({ id, client_id, name, description, price, stock_quantity });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.deleteProduct = async (req, res) => {
    const { id } = req.params;
    try {
        await db.execute('DELETE FROM products WHERE id = ?', [id]);
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};