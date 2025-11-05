// ** routes/settings.js **
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const settingsController = require('../controllers/settingsController');

router.use(authenticateToken);

router.get('/', settingsController.getSettings);
router.put('/', settingsController.updateSettings);

module.exports = router;
