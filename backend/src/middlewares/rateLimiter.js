const rateLimit = require('express-rate-limit');

/**
 * Standard API Rate Limiters
 */

// Rate limiter for read endpoints (GET)
const readLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 200, // Limit each IP to 200 requests per minute
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many requests on read endpoint, please try again after a minute',
    },
});

// Rate limiter for write endpoints (POST, PUT, PATCH, DELETE)
const writeLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 60, // Limit each IP to 60 requests per minute
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many requests on write endpoint, please try again after a minute',
    },
});

module.exports = {
    readLimiter,
    writeLimiter,
    staffReadLimiter: readLimiter,
    staffWriteLimiter: writeLimiter,
    settingReadLimiter: readLimiter,
    settingWriteLimiter: writeLimiter,
    tableReadLimiter: readLimiter,
    tableWriteLimiter: writeLimiter,
    orderReadLimiter: readLimiter,
    orderWriteLimiter: writeLimiter,
    billingReadLimiter: readLimiter,
    billingWriteLimiter: writeLimiter,
};
