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

/**
 * Middleware to authorize roles.
 */
const authorize = (roles = []) => {
    if (typeof roles === 'string') {
        roles = [roles];
    }

    return (req, res, next) => {
        if (!req.user || (roles.length && !roles.includes(req.user.role))) {
            return sendError(res, 403, 'Forbidden: You do not have permission to perform this action');
        }
        next();
    };
};

module.exports = { 
    authenticate: auth,
    authorize
};
