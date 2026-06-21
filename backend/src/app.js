const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { sendResponse, sendError } = require('./utils/apiResponse');
const performanceLogger = require('./middlewares/performanceLogger');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// Performance Logger Middleware
app.use(performanceLogger);

// Global Rate Limiter
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again after 15 minutes',
    },
});

app.use('/api/', globalLimiter);

// Health Check
app.get('/health', (req, res) => {
    return sendResponse(res, 200, true, 'Server is running healthy');
});

// Routes
app.use('/api/v1/test', require('./routes/test.routes'));
app.use('/api/v1/staff', require('./routes/v1/staff.routes'));

// Global Error Handler
app.use(errorHandler);

// 404 Handler
app.use((req, res) => {
    return sendError(res, 404, 'Route not found');
});

module.exports = app;
