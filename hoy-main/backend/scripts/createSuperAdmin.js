// ** scripts/createSuperAdmin.js **
// Script to create Super Admin user
const bcrypt = require('bcrypt');
const pool = require('../utils/db');
require('dotenv').config();

const createSuperAdmin = async () => {
  try {
    const email = process.env.SUPERADMIN_EMAIL || 'superadmin@rga.com';
    const password = process.env.SUPERADMIN_PASSWORD || 'superadmin123';
    const name = process.env.SUPERADMIN_NAME || 'Super Admin';

    // Check if superadmin already exists
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE email = ? OR role = ?',
      [email, 'superadmin']
    );

    if (existing.length > 0) {
      console.log('Super Admin already exists!');
      console.log('Existing superadmin:', existing);
      return;
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Create superadmin
    const [result] = await pool.execute(
      `INSERT INTO users (name, email, password_hash, role, status) 
       VALUES (?, ?, ?, 'superadmin', 'active')`,
      [name, email, password_hash]
    );

    console.log('✅ Super Admin created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('User ID:', result.insertId);
    console.log('\n⚠️  Please change the password after first login!');

  } catch (error) {
    console.error('❌ Error creating Super Admin:', error);
    
    if (error.code === 'ER_BAD_FIELD_ERROR') {
      console.error('\n⚠️  Please run the migration first:');
      console.error('   Run: backend/migrations/add_superadmin_role.sql in phpMyAdmin');
    }
  } finally {
    process.exit();
  }
};

createSuperAdmin();


