// ** server.js **
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { testConnection } = require('./config/db');
const path = require('path');
const WebSocket = require('ws');


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
const userRoutes = require('./routes/users');
const clientRoutes = require('./routes/clientRoutes');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const alertRoutes = require('./routes/alerts');
const uploadRoutes = require('./routes/uploads');
const logRoutes = require('./routes/logs');
const adMetricsRoutes = require('./routes/adMetricsRoutes');
const seoRoutes = require('./routes/seo');
const publicRoutes = require('./routes/public');
const queueRoutes = require('./routes/queue');
const dashboardRoutes = require('./routes/dashboard');
const aiAgentRoutes = require('./routes/aiAgent');
const reportRoutes = require('./routes/reports');
const ecommerceRoutes = require('./routes/ecommerce');
const dataIntegrationRoutes = require('./routes/dataIntegration');
const settingsRoutes = require('./routes/settings');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/ad-metrics', adMetricsRoutes);
app.use('/api/seo', seoRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai', aiAgentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/ecommerce', ecommerceRoutes);
app.use('/api/integration', dataIntegrationRoutes);
app.use('/api/settings', settingsRoutes);



// Test database connection on startup
const initializeApp = async () => {
  try {
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('Failed to connect to the database. Exiting...');
      process.exit(1);
    }
    
    // Start the server
    const server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Initialize WebSocket Server
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('Client connected');
  
  ws.on('message', (message) => {
    console.log('Received:', message);
    // ส่งข้อความกลับไปยัง client
    ws.send(`Server received: ${message}`);
  });
  
  ws.on('close', () => {
    console.log('Client disconnected');
  });
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