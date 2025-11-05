// ** API Routes: routes/clientRoutes.js **
const express = require('express');
const router = express.Router();
const pool = require('../utils/db');

// ดึงข้อมูลลูกค้าทั้งหมด
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT id, name, email, phone FROM clients');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching clients:', error);
        res.status(500).json({ message: 'Error fetching client data' });
    }
});

// ดึงข้อมูลลูกค้าตาม ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.execute('SELECT * FROM clients WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Client not found' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error('Error fetching client by ID:', error);
        res.status(500).json({ message: 'Error fetching client data' });
    }
});

// สร้างลูกค้าใหม่
router.post('/', async (req, res) => {
    const { name, email, phone } = req.body;
    if (!name) {
        return res.status(400).json({ message: 'Name is required' });
    }
    try {
        const [result] = await pool.execute(
            'INSERT INTO clients (name, email, phone) VALUES (?, ?, ?)',
            [name, email || null, phone || null]
        );
        res.status(201).json({ id: result.insertId, name, email, phone });
    } catch (error) {
        console.error('Error creating client:', error);
        res.status(500).json({ message: 'Error creating client' });
    }
});

// อัพเดทลูกค้า
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, email, phone } = req.body;
    if (!name) {
        return res.status(400).json({ message: 'Name is required' });
    }
    try {
        await pool.execute(
            'UPDATE clients SET name = ?, email = ?, phone = ? WHERE id = ?',
            [name, email || null, phone || null, id]
        );
        res.json({ id, name, email, phone });
    } catch (error) {
        console.error('Error updating client:', error);
        res.status(500).json({ message: 'Error updating client' });
    }
});

// ลบลูกค้า
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.execute('DELETE FROM clients WHERE id = ?', [id]);
        res.json({ message: 'Client deleted successfully' });
    } catch (error) {
        console.error('Error deleting client:', error);
        res.status(500).json({ message: 'Error deleting client' });
    }
});

module.exports = router;