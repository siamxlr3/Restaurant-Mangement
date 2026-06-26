const { sendError } = require('../utils/apiResponse');

/**
 * Middleware to validate request data using a Zod schema.
 * @param {import('zod').ZodSchema} schema - The Zod schema to validate against.
 * @param {string} property - The property of the request object to validate (body, query, params).
 */
const validate = (schema, property = 'body') => {
    return (req, res, next) => {
        try {
            schema.parse(req[property]);
            next();
        } catch (error) {
            const errorMessage = error.errors ? error.errors.map(e => e.message).join(', ') : error.message;
            return sendError(res, 400, errorMessage, error.errors);
        }
    };
};

module.exports = validate;
