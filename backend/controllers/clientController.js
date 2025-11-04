// ** controllers/clientController.js **
const db = require('../utils/db'); // ต้องใช้ utils/db นะครับ
const clientModel = require('../models/Client');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

// ✅ ต้องมีการใช้ exports. เพื่อส่งออกฟังก์ชัน
// @desc    Get all clients
// @route   GET /api/clients
// @access  Private/Admin
exports.getAllClients = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;
    
    // Search
    const search = req.query.search || '';
    let whereClause = {};
    
    if (search) {
      whereClause = {
        name: { [Op.like]: `%${search}%` },
        // Add more searchable fields as needed
      };
    }

    const { count, rows: clients } = await clientModel.findAndCountAll({
      where: whereClause,
      attributes: ['id', 'name', 'email', 'phone', 'created_at'],
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });

    // Calculate pagination info
    const totalPages = Math.ceil(count / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    res.json({
      success: true,
      count: clients.length,
      total: count,
      totalPages,
      currentPage: page,
      hasNextPage,
      hasPreviousPage,
      data: clients
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single client
// @route   GET /api/clients/:id
// @access  Private
exports.getClient = async (req, res, next) => {
  try {
    const client = await clientModel.findByPk(req.params.id, {
      attributes: { exclude: ['updatedAt'] },
      include: [
        {
          model: db.Order,
          as: 'orders',
          attributes: ['id', 'total_amount', 'status', 'created_at'],
          limit: 5,
          order: [['created_at', 'DESC']]
        }
      ]
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Get client stats
    const stats = await clientModel.getClientStats(req.params.id);

    res.json({
      success: true,
      data: {
        ...client.toJSON(),
        stats
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new client
// @route   POST /api/clients
// @access  Private/Admin
exports.createClient = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, email, phone } = req.body;

    // Check if client with email already exists
    const existingClient = await clientModel.findOne({ where: { email } });
    if (existingClient) {
      return res.status(400).json({
        success: false,
        message: 'Client with this email already exists'
      });
    }

    const client = await clientModel.create({
      name,
      email,
      phone
    });

    res.status(201).json({
      success: true,
      data: client
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update client
// @route   PUT /api/clients/:id
// @access  Private/Admin
exports.updateClient = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, email, phone } = req.body;
    const client = await clientModel.findByPk(req.params.id);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Check if email is being updated and if it's already taken
    if (email && email !== client.email) {
      const existingClient = await clientModel.findOne({ where: { email } });
      if (existingClient) {
        return res.status(400).json({
          success: false,
          message: 'Email is already in use by another client'
        });
      }
    }

    // Update client
    const updatedClient = await client.update({
      name: name || client.name,
      email: email || client.email,
      phone: phone || client.phone
    });

    res.json({
      success: true,
      data: updatedClient
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete client
// @route   DELETE /api/clients/:id
// @access  Private/Admin
exports.deleteClient = async (req, res, next) => {
  try {
    const client = await clientModel.findByPk(req.params.id);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    await client.destroy();

    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get client orders
// @route   GET /api/clients/:id/orders
// @access  Private
exports.getClientOrders = async (req, res, next) => {
  try {
    const client = await clientModel.findByPk(req.params.id);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    const { count, rows: orders } = await db.Order.findAndCountAll({
      where: { client_id: req.params.id },
      include: [
        {
          model: db.OrderItem,
          as: 'items',
          include: [
            {
              model: db.Product,
              as: 'product',
              attributes: ['id', 'name', 'price']
            }
          ]
        }
      ],
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });

    // Calculate pagination info
    const totalPages = Math.ceil(count / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    res.json({
      success: true,
      count: orders.length,
      total: count,
      totalPages,
      currentPage: page,
      hasNextPage,
      hasPreviousPage,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};