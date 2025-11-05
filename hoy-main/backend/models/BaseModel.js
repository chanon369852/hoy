const { pool } = require('../config/db');

class BaseModel {
  constructor(tableName) {
    this.tableName = tableName;
  }

  // Generic find all with optional where conditions
  async findAll(conditions = {}, columns = '*') {
    try {
      let query = `SELECT ${columns} FROM ${this.tableName}`;
      const values = [];
      let whereClause = '';
      
      // Build WHERE clause if conditions are provided
      const conditionsArray = Object.entries(conditions);
      if (conditionsArray.length > 0) {
        whereClause = ' WHERE ' + conditionsArray.map(([key], index) => 
          `${key} = ?`
        ).join(' AND ');
        values.push(...Object.values(conditions));
      }
      
      query += whereClause;
      
      const [rows] = await pool.query(query, values);
      return rows;
    } catch (error) {
      console.error(`Error in findAll for ${this.tableName}:`, error);
      throw error;
    }
  }

  // Find one record by ID
  async findById(id, columns = '*') {
    try {
      const [rows] = await pool.query(
        `SELECT ${columns} FROM ${this.tableName} WHERE id = ?`,
        [id]
      );
      return rows[0] || null;
    } catch (error) {
      console.error(`Error in findById for ${this.tableName}:`, error);
      throw error;
    }
  }

  // Create a new record
  async create(data) {
    try {
      const keys = Object.keys(data);
      const values = Object.values(data);
      const placeholders = keys.map(() => '?').join(', ');
      
      const [result] = await pool.query(
        `INSERT INTO ${this.tableName} (${keys.join(', ')}) VALUES (${placeholders})`,
        values
      );
      
      return this.findById(result.insertId);
    } catch (error) {
      console.error(`Error in create for ${this.tableName}:`, error);
      throw error;
    }
  }

  // Update a record by ID
  async update(id, data) {
    try {
      const keys = Object.keys(data);
      const values = Object.values(data);
      const setClause = keys.map(key => `${key} = ?`).join(', ');
      
      const [result] = await pool.query(
        `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`,
        [...values, id]
      );
      
      if (result.affectedRows === 0) {
        return null; // No record was updated
      }
      
      return this.findById(id);
    } catch (error) {
      console.error(`Error in update for ${this.tableName}:`, error);
      throw error;
    }
  }

  // Delete a record by ID
  async delete(id) {
    try {
      const [result] = await pool.query(
        `DELETE FROM ${this.tableName} WHERE id = ?`,
        [id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error(`Error in delete for ${this.tableName}:`, error);
      throw error;
    }
  }

  // Count total records with optional conditions
  async count(conditions = {}) {
    try {
      let query = `SELECT COUNT(*) as count FROM ${this.tableName}`;
      const values = [];
      
      const conditionsArray = Object.entries(conditions);
      if (conditionsArray.length > 0) {
        const whereClause = ' WHERE ' + conditionsArray.map(([key], index) => 
          `${key} = ?`
        ).join(' AND ');
        
        query += whereClause;
        values.push(...Object.values(conditions));
      }
      
      const [rows] = await pool.query(query, values);
      return rows[0].count;
    } catch (error) {
      console.error(`Error in count for ${this.tableName}:`, error);
      throw error;
    }
  }
}

module.exports = BaseModel;
