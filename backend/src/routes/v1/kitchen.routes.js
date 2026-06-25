const express = require('express');
const router = express.Router();
const kitchenController = require('../../controllers/kitchen.controller');
const validate = require('../../middlewares/validate');
const { updateTicketStatusSchema, createTicketSchema } = require('../../validators/kitchen_ticket.validator');
const authenticate = require('../../middlewares/auth');
const authorize = require('../../middlewares/rbac');
const rateLimit = require('express-rate-limit');

// Rate limiting
const writeLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    message: { success: false, message: 'Too many updates, please wait a minute' }
});

const readLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 200,
    message: { success: false, message: 'Too many requests, please wait a minute' }
});

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/kitchen/tickets
 * @desc    Get all active kitchen tickets
 * @access  Private (Staff/Admin)
 */
router.get('/tickets', 
    readLimiter, 
    authorize(['admin', 'staff', 'chef']), 
    kitchenController.getTickets
);

/**
 * @route   POST /api/v1/kitchen/tickets
 * @desc    Create a manual kitchen ticket
 * @access  Private (Admin/Chef)
 */
router.post('/tickets', 
    writeLimiter, 
    authorize(['admin', 'chef']), 
    validate(createTicketSchema), 
    kitchenController.createTicket
);

/**
 * @route   PATCH /api/v1/kitchen/tickets/:id/status
 * @desc    Update ticket status (Preparing, Ready, Bumped)
 * @access  Private (Staff/Admin/Chef)
 */
router.patch('/tickets/:id/status', 
    writeLimiter, 
    authorize(['admin', 'staff', 'chef']), 
    validate(updateTicketStatusSchema), 
    kitchenController.updateTicketStatus
);

module.exports = router;
