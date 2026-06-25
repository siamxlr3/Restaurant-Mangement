const jwt = require('jsonwebtoken');
const { sendError } = require('../utils/apiResponse');

/**
 * Middleware to verify JWT token.
 */
const auth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    // Development bypass: provide a mock user if no token is provided in dev environment
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        if (process.env.NODE_ENV === 'development') {
            req.user = { id: 'dev-user-id', role: 'admin', email: 'dev@example.com' };
            return next();
        }
        return sendError(res, 401, 'Unauthorized: No token provided');
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
        req.user = decoded;
        next();
    } catch (error) {
        return sendError(res, 401, 'Unauthorized: Invalid token');
    }
};

module.exports = auth;
