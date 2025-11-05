// ** routes/users.js **
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Get current user profile (authenticated users)
router.get('/profile', authenticateToken, userController.getProfile);

// Update current user profile (authenticated users)
router.put('/profile', authenticateToken, userController.updateProfile);

// Change user role (users can change their own role)
router.put('/profile/role', authenticateToken, userController.changeRole);

// Admin routes
// Get all users (Admin and Super Admin only)
router.get('/', authenticateToken, authorizeRole(['admin', 'superadmin']), userController.getAllUsers);

// Update user by admin (Admin and Super Admin only)
router.put('/:id', authenticateToken, authorizeRole(['admin', 'superadmin']), userController.updateUserByAdmin);

module.exports = router;