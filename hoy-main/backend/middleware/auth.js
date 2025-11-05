// ** middleware/auth.js **
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Authentication required. No token provided.' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token.' });
        }
        req.user = user; // แนบ { id, client_id, role, email }
        next();
    });
};

const authorizeRole = (requiredRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(403).json({ message: 'Access denied. User role not found.' });
        }
        
        // Super Admin has access to everything
        if (req.user.role === 'superadmin') {
            return next();
        }
        
        if (requiredRoles.includes(req.user.role)) {
            next();
        } else {
            res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
        }
    };
};

module.exports = {
    authenticateToken,
    authorizeRole
};