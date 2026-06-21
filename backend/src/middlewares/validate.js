const { sendError } = require('../utils/apiResponse');

/**
 * Middleware to validate request body using a Zod schema.
 * @param {import('zod').ZodSchema} schema - The Zod schema to validate against.
 */
const validate = (schema) => {
    return (req, res, next) => {
        try {
            schema.parse(req.body);
            next();
        } catch (error) {
            const errorMessage = error.errors ? error.errors.map(e => e.message).join(', ') : error.message;
            return sendError(res, 400, errorMessage, error.errors);
        }
    };
};

module.exports = validate;
