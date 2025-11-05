// ** controllers/productController.js **
const pool = require('../utils/db');
const { fetchProductsFromExternalApi } = require('../services/externalApiService');

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
        const [rows] = await pool.execute(query, params);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// นำเข้าสินค้าจาก API ภายนอก (Admin/Manager เท่านั้น)
exports.importProductsFromExternalApi = async (req, res) => {
    const { apiUrl, apiKey, client_id } = req.body;
    
    if (!apiUrl) {
        return res.status(400).json({ message: 'API URL is required' });
    }

    try {
        // เรียกใช้ฟังก์ชันดึงข้อมูลจาก API ภายนอก
        const externalProducts = await fetchProductsFromExternalApi(apiUrl, apiKey);
        
        // ตรวจสอบและแปลงข้อมูลให้เข้ากับฐานข้อมูลของเรา
        if (!Array.isArray(externalProducts)) {
            return res.status(400).json({ 
                message: 'Invalid data format from external API',
                received: externalProducts
            });
        }

        const importedProducts = [];
        const errors = [];

        // วนลูปนำเข้าข้อมูลทีละรายการ
        for (const product of externalProducts) {
            try {
                // ตรวจสอบว่าสินค้ามีอยู่แล้วหรือไม่
                const [existing] = await pool.execute(
                    'SELECT id FROM products WHERE external_id = ? AND client_id = ?',
                    [product.id, client_id]
                );

                if (existing.length > 0) {
                    // อัพเดทสินค้าที่มีอยู่
                    await pool.execute(
                        `UPDATE products 
                         SET name = ?, description = ?, price = ?, stock_quantity = ?, updated_at = NOW()
                         WHERE external_id = ? AND client_id = ?`,
                        [
                            product.name || product.title || 'No Name',
                            product.description || product.desc || null,
                            product.price || 0,
                            product.stock_quantity || product.quantity || 0,
                            product.id,
                            client_id
                        ]
                    );
                    importedProducts.push({ ...product, action: 'updated' });
                } else {
                    // เพิ่มสินค้าใหม่
                    const [result] = await pool.execute(
                        `INSERT INTO products 
                         (client_id, name, description, price, stock_quantity, external_id) 
                         VALUES (?, ?, ?, ?, ?, ?)`,
                        [
                            client_id,
                            product.name || product.title || 'No Name',
                            product.description || product.desc || null,
                            product.price || 0,
                            product.stock_quantity || product.quantity || 0,
                            product.id
                        ]
                    );
                    importedProducts.push({ 
                        ...product, 
                        id: result.insertId,
                        action: 'created' 
                    });
                }
            } catch (error) {
                console.error(`Error importing product ${product.id}:`, error);
                errors.push({
                    productId: product.id,
                    error: error.message
                });
            }
        }

        res.status(200).json({
            success: true,
            imported: importedProducts.length,
            errors: errors.length,
            details: {
                imported: importedProducts,
                errors: errors
            }
        });

    } catch (error) {
        console.error('Error importing products:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to import products',
            error: error.message 
        });
    }
};

// สร้างสินค้าใหม่ (Admin/Manager เท่านั้น)
exports.createProduct = async (req, res) => {
    const { client_id, name, description, price, stock_quantity } = req.body;

    if (!client_id || !name || !price) {
        return res.status(400).json({ message: 'Missing required fields (client_id, name, price).' });
    }
    
    try {
        const [result] = await pool.execute(
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
        await pool.execute(
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
        await pool.execute('DELETE FROM products WHERE id = ?', [id]);
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};