const jwt = require('jsonwebtoken');
const { sendError } = require('../utils/apiResponse');

/**
 * Middleware to verify JWT token.
 */
const auth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const isDev = process.env.NODE_ENV === 'development';
    
    // Development bypass: provide a mock user if no token is provided in dev environment
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        if (isDev) {
            req.user = { id: 'dev-user-id', role: 'admin', email: 'dev@example.com' };
            return next();
        }
        return sendError(res, 401, 'Unauthorized: No token provided');
    }

    const token = authHeader.split(' ')[1];

    // Catch placeholder or invalid string tokens in development mode
    if (isDev && (!token || token === 'null' || token === 'undefined' || token === 'dev-token')) {
        req.user = { id: 'dev-user-id', role: 'admin', email: 'dev@example.com' };
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
        req.user = decoded;
        next();
    } catch (error) {
        if (isDev) {
            req.user = { id: 'dev-user-id', role: 'admin', email: 'dev@example.com' };
            return next();
        }
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
