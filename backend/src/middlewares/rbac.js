const { sendError } = require('../utils/apiResponse');

/**
 * Middleware to check if the user has the required role.
 * @param {string[]} allowedRoles - Array of roles allowed to access the route.
 */
const rbac = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return sendError(res, 403, 'Forbidden: You do not have permission to perform this action');
        }
        next();
    };
};

module.exports = rbac;
