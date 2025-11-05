// ** controllers/clientController.js **

// ✅ ต้องแก้ไข Path เป็น '../utils/db' ตามโครงสร้างโฟลเดอร์ของคุณ
const db = require('../utils/db'); 

// --------------------------------------------------
// 1. ดึงข้อมูลลูกค้าทั้งหมด (getAllClients)
// --------------------------------------------------
// ✅ ใช้ exports. เพื่อส่งออกฟังก์ชันไปยัง Route
exports.getAllClients = async (req, res) => {
    try {
        // ดึงข้อมูลลูกค้าทั้งหมด (Admin/Manager)
        const [rows] = await db.execute('SELECT id, name, email, phone FROM clients');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching clients:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// --------------------------------------------------
// 2. ดึงข้อมูลลูกค้าตาม ID (getClientById)
// --------------------------------------------------
// ✅ ใช้ exports. เพื่อส่งออกฟังก์ชัน
exports.getClientById = async (req, res) => {
    const { id } = req.params;
    const { role, client_id } = req.user; // ดึงข้อมูลจาก Token

    // Authorization Check: Admin/Manager หรือ Viewer ที่ดูข้อมูล client_id ของตัวเองเท่านั้น
    if (role !== 'admin' && role !== 'manager' && client_id != id) {
        return res.status(403).json({ message: 'Access denied. You can only view your own client data.' });
    }

    try {
        const [rows] = await db.execute('SELECT * FROM clients WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Client not found' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error('Error fetching client by ID:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// --------------------------------------------------
// 3. ฟังก์ชันอื่นๆ (ตามที่ถูก Comment ไว้ใน routes/clients.js)
// --------------------------------------------------
exports.createClient = async (req, res) => {
    res.status(501).json({ message: "Create Client API not implemented yet." });
    // TODO: Add database INSERT logic here
};

exports.updateClient = async (req, res) => {
    res.status(501).json({ message: "Update Client API not implemented yet." });
    // TODO: Add database UPDATE logic here
};

// ... คุณอาจมี exports อื่นๆ เช่น deleteClient ...