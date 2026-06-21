const rateLimit = require('express-rate-limit');

/**
 * Global rate limiter configuration
 */
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again after 15 minutes',
    },
});

/**
 * Higher limit for "heavy" APIs if needed
 */
const heavyApiLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    message: {
        success: false,
        message: 'Too many heavy requests, please try again after an hour',
    },
});

module.exports = {
    globalLimiter,
    heavyApiLimiter,
    staffReadLimiter: rateLimit({
        windowMs: 60 * 1000,
        max: 200,
        message: { success: false, message: 'Too many read requests, please try again after a minute' },
    }),
    staffWriteLimiter: rateLimit({
        windowMs: 60 * 1000,
        max: 60,
        message: { success: false, message: 'Too many write requests, please try again after a minute' },
    }),
};
