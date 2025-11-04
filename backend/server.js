// ** server.js **
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { testConnection } = require('./config/db');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ----------------------------------------------------------------
// Import Routes ทั้งหมด
// ----------------------------------------------------------------
// แก้ไข Path เป็น './routes/filename'
const authRoutes = require('./routes/auth');       
const clientRoutes = require('./routes/clientRoutes');   
const adMetricsRoutes = require('./routes/adMetricsRoutes'); 
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const alertRoutes = require('./routes/alerts');
const seoMetricsRoutes = require('./routes/seo'); 
const auditLogsRoutes = require('./routes/logs');  
const uploadRoutes = require('./routes/uploads');

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

// Test database connection on startup
const initializeApp = async () => {
  try {
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('Failed to connect to the database. Exiting...');
      process.exit(1);
    }
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to initialize application:', error);
    process.exit(1);
  }
};

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'RGA Dashboard API is running',
    status: 'success',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Not Found',
    path: req.originalUrl
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Error:`, err);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    status: 'error',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Initialize the application
initializeApp();