// ** routes/aiAgent.js **
const express = require('express');
const router = express.Router();
const aiAgentController = require('../controllers/aiAgentController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Natural Language Query
router.post('/query', aiAgentController.naturalLanguageQuery);

// Generate Insights
router.get('/insights', aiAgentController.generateInsights);

// Anomaly Detection
router.get('/anomalies', aiAgentController.detectAnomalies);

// Get Recommendations
router.get('/recommendations', aiAgentController.getRecommendations);

module.exports = router;



