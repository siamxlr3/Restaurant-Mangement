/**
 * Standard API Response Utility
 */
const sendResponse = (res, statusCode, success, message, data = null, meta = null) => {
    return res.status(parseInt(statusCode)).json({
        success,
        message,
        data,
        meta,
    });
};

const sendError = (res, statusCode, message, error = null) => {
    return res.status(parseInt(statusCode)).json({
        success: false,
        message,
        error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
};

module.exports = {
    sendResponse,
    sendError,
};
