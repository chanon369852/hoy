// ** controllers/userController.js **
// User Controller - Profile management and role changes
const pool = require('../utils/db');
const bcrypt = require('bcrypt');

// Get current user profile
exports.getProfile = async (req, res) => {
  const { id } = req.user;

  try {
    const [rows] = await pool.execute(
      'SELECT id, name, email, role, client_id, status, created_at FROM users WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Update user profile (name, email, password)
exports.updateProfile = async (req, res) => {
  const { id, role } = req.user;
  const { name, email, password, newPassword } = req.body;

  try {
    // Get current user data
    const [currentUser] = await pool.execute(
      'SELECT id, name, email, password_hash FROM users WHERE id = ?',
      [id]
    );

    if (currentUser.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = currentUser[0];
    const updates = [];
    const values = [];

    // Update name
    if (name !== undefined && name !== null) {
      updates.push('name = ?');
      values.push(name);
    }

    // Update email (check if already exists)
    if (email !== undefined && email !== null && email !== user.email) {
      const [existing] = await pool.execute(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, id]
      );

      if (existing.length > 0) {
        return res.status(409).json({ message: 'Email already exists' });
      }

      updates.push('email = ?');
      values.push(email);
    }

    // Update password (requires current password)
    if (newPassword !== undefined && newPassword !== null) {
      if (!password) {
        return res.status(400).json({ message: 'Current password is required to change password' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password_hash || '');
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }

      const password_hash = await bcrypt.hash(newPassword, 10);
      updates.push('password_hash = ?');
      values.push(password_hash);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    values.push(id);
    await pool.execute(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Get updated user data
    const [updatedUser] = await pool.execute(
      'SELECT id, name, email, role, client_id, status FROM users WHERE id = ?',
      [id]
    );

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser[0]
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Change user role (only user can change their own role to admin)
exports.changeRole = async (req, res) => {
  const { id, role: currentRole } = req.user;
  const { role: newRole } = req.body;

  try {
    // Only allow users to change their own role
    // Allow changing to admin (for testing/demo purposes)
    // In production, you might want to add additional security checks
    
    if (!['superadmin', 'admin', 'manager', 'viewer'].includes(newRole)) {
      return res.status(400).json({ message: 'Invalid role. Must be superadmin, admin, manager, or viewer' });
    }

    // Prevent non-superadmin from becoming superadmin
    if (newRole === 'superadmin' && currentRole !== 'superadmin') {
      return res.status(403).json({ message: 'Only superadmin can assign superadmin role to themselves' });
    }

    // Check if user wants to become admin
    if (newRole === 'admin' && currentRole !== 'admin' && currentRole !== 'superadmin') {
      // Allow self-promotion to admin (for demo purposes)
      // In production, you might want to require approval or additional verification
      console.log(`User ${id} is changing role from ${currentRole} to admin`);
    }

    await pool.execute(
      'UPDATE users SET role = ? WHERE id = ?',
      [newRole, id]
    );

    // Get updated user data
    const [updatedUser] = await pool.execute(
      'SELECT id, name, email, role, client_id, status FROM users WHERE id = ?',
      [id]
    );

    res.json({
      message: 'Role updated successfully',
      user: updatedUser[0]
    });

  } catch (error) {
    console.error('Error changing role:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Get all users (Admin only)
exports.getAllUsers = async (req, res) => {
  const { role, client_id } = req.user;

  try {
    let query = 'SELECT id, name, email, role, client_id, status, created_at FROM users';
    const params = [];

    // If not admin, only show users from same client
    // Super Admin and Admin can see all users
    if (role !== 'admin' && role !== 'superadmin') {
      query += ' WHERE client_id = ?';
      params.push(client_id);
    }

    query += ' ORDER BY created_at DESC';

    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Update user by admin
exports.updateUserByAdmin = async (req, res) => {
  const { role: currentRole } = req.user;
  const { id } = req.params;
  const { name, email, role, status } = req.body;

  // Only admin and superadmin can update other users
  if (currentRole !== 'admin' && currentRole !== 'superadmin') {
    return res.status(403).json({ message: 'Only admin can update other users' });
  }

  try {
    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }

    if (email !== undefined) {
      // Check if email already exists
      const [existing] = await pool.execute(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, id]
      );

      if (existing.length > 0) {
        return res.status(409).json({ message: 'Email already exists' });
      }

      updates.push('email = ?');
      values.push(email);
    }

    if (role !== undefined) {
      if (!['superadmin', 'admin', 'manager', 'viewer'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
      }
      // Only superadmin can assign superadmin role
      if (role === 'superadmin' && currentRole !== 'superadmin') {
        return res.status(403).json({ message: 'Only superadmin can assign superadmin role' });
      }
      updates.push('role = ?');
      values.push(role);
    }

    if (status !== undefined) {
      if (!['active', 'inactive', 'pending'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      updates.push('status = ?');
      values.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    values.push(id);
    await pool.execute(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const [updatedUser] = await pool.execute(
      'SELECT id, name, email, role, client_id, status FROM users WHERE id = ?',
      [id]
    );

    res.json({
      message: 'User updated successfully',
      user: updatedUser[0]
    });

  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
