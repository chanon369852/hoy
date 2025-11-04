// ** middleware/auth.js ** (โค้ดเหมือนเดิม)
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

const authenticateToken = (req, res, next) => {
    // ... (Logic การตรวจสอบ JWT token)
    // ... (แนบ req.user = user)
    // ...
};

const authorizeRole = (requiredRoles) => {
    // ... (Logic การตรวจสอบ role)
    // ...
};

module.exports = {
    authenticateToken,
    authorizeRole
};