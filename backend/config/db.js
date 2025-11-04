const mysql = require('mysql2/promise');
require('dotenv').config();

// Create a connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost', // Default to localhost if not specified
  user: process.env.DB_USER || 'root',      // Default to root if not specified
  password: process.env.DB_PASSWORD || '',  // Default to empty password
  database: process.env.DB_NAME || 'rga_dashboard', // Default database name
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true // Return dates as strings instead of Date objects
});

// Test the database connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Successfully connected to the database');
    connection.release();
    return true;
  } catch (error) {
    console.error('Error connecting to the database:', error);
    return false;
  }
};

module.exports = {
  pool,
  testConnection
};
