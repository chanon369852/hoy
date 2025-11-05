// ** utils/app.js **
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const app = express();

// Middleware พื้นฐาน
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' })); 
app.use(express.json()); // สำหรับอ่านค่า JSON ใน body

// ----------------------------------------------------------------
// นำเข้า Routes ทั้งหมด
// ----------------------------------------------------------------
const authRoutes = require('../routes/auth');
const clientRoutes = require('../routes/clientRoutes');
const adMetricsRoutes = require('../routes/adMetricsRoutes'); // ใช้ชื่อไฟล์ตามที่คุณมี
const userRoutes = require('../routes/users');
const productRoutes = require('../routes/products');
const orderRoutes = require('../routes/orders');
const alertRoutes = require('../routes/alerts');
const seoMetricsRoutes = require('../routes/seo');
const auditLogsRoutes = require('../routes/logs');
const uploadRoutes = require('../routes/uploads');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/ad-metrics', adMetricsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/seo-metrics', seoMetricsRoutes);
app.use('/api/audit-logs', auditLogsRoutes);
app.use('/api/uploads', uploadRoutes);

// Endpoint ทดสอบ
app.get('/', (req, res) => {
    res.send('RGA Dashboard API Running! (via utils/app.js)');
});

// Middleware จัดการ Error ทั่วไป (ควรมี)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send({ message: 'Something broke!', error: err.message });
});

module.exports = app;