const morgan = require('morgan');

const performanceLogger = (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        if (duration > 500) {
            console.warn(`[PERFORMANCE WARNING] ${req.method} ${req.originalUrl} took ${duration}ms`);
        }
    });
    next();
};

module.exports = performanceLogger;
