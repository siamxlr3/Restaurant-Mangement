const morgan = require('morgan');

const performanceLogger = (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        const timestamp = new Date().toISOString();
        const logEntry = `${timestamp} | ${req.method} ${req.originalUrl} | Status: ${res.statusCode} | Duration: ${duration}ms`;

        if (duration > 500) {
            console.error(`[PERFORMANCE ALERT] ${logEntry}`);
            // Here you could add a real alert mechanism like Slack, PagerDuty, etc.
        } else if (duration > 300) {
            console.warn(`[PERFORMANCE WARNING] ${logEntry}`);
        } else {
            console.log(logEntry);
        }
    });
    next();
};

module.exports = performanceLogger;
