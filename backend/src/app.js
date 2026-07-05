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
app.use('/api/v1/settings', require('./routes/v1/setting.routes'));
app.use('/api/v1/categories', require('./routes/v1/category.routes'));
app.use('/api/v1/items', require('./routes/v1/item.routes'));
app.use('/api/v1/variants', require('./routes/v1/variant.routes'));
app.use('/api/v1/modifiers', require('./routes/v1/modifier.routes'));
app.use('/api/v1/tables', require('./routes/v1/table.routes'));
app.use('/api/v1/orders', require('./routes/v1/order.routes'));
app.use('/api/v1/kitchen', require('./routes/v1/kitchen.routes'));
app.use('/api/v1/upsell', require('./routes/v1/upsell.routes'));
app.use('/api/v1/bills', require('./routes/v1/bill.routes'));
app.use('/api/v1/payments', require('./routes/v1/payment.routes'));
app.use('/api/v1/payment-gateways', require('./routes/v1/payment.gateway.routes'));
app.use('/api/v1/reservations', require('./routes/v1/reservation.routes'));
app.use('/api/v1/waitlist', require('./routes/v1/waitlist.routes'));
app.use('/api/v1/ingredients', require('./routes/v1/ingredient.routes'));
app.use('/api/v1/recipes', require('./routes/v1/recipe.routes'));
app.use('/api/v1/suppliers', require('./routes/v1/supplier.routes'));
app.use('/api/v1/purchase-orders', require('./routes/v1/purchaseOrder.routes'));
app.use('/api/v1/reorder-suggestions', require('./routes/v1/reorder.routes'));
app.use('/api/v1/demand-forecasts', require('./routes/v1/demandForecast.routes'));
app.use('/api/v1/reports', require('./routes/v1/reports.routes'));
app.use('/api/webhooks', require('./routes/webhook.routes'));

// CMS Routes
app.use('/api/v1/cms/site-config', require('./routes/v1/cms.siteConfig.routes'));
app.use('/api/v1/cms/ticker-items', require('./routes/v1/cms.tickerItems.routes'));
app.use('/api/v1/cms/hero', require('./routes/v1/cms.hero.routes'));
app.use('/api/v1/cms/story', require('./routes/v1/cms.story.routes'));
app.use('/api/v1/cms/featured-dishes', require('./routes/v1/cms.featuredDishes.routes'));
app.use('/api/v1/cms/features', require('./routes/v1/cms.features.routes'));
app.use('/api/v1/cms/gallery-items', require('./routes/v1/cms.galleryItems.routes'));
app.use('/api/v1/cms/reviews', require('./routes/v1/cms.reviews.routes'));
app.use('/api/v1/cms/opening-hours', require('./routes/v1/cms.openingHours.routes'));
app.use('/api/v1/cms/location', require('./routes/v1/cms.location.routes'));
app.use('/api/v1/cms/faq-items', require('./routes/v1/cms.faqItems.routes'));
app.use('/api/v1/cms/reservation-config', require('./routes/v1/cms.reservationConfig.routes'));



// Global Error Handler
app.use(errorHandler);

// 404 Handler
app.use((req, res) => {
    return sendError(res, 404, 'Route not found');
});

module.exports = app;
