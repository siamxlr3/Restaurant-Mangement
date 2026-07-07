const express = require('express');
const router = express.Router();
const aiChatController = require('../../controllers/aiChat.controller');
const { authenticate } = require('../../middlewares/auth');
const { readLimiter, writeLimiter } = require('../../middlewares/rateLimiter');

// All AI assistant routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/ai/chat/sessions
 * @desc    Get paginated chat sessions for the manager
 */
router.get('/sessions', readLimiter, aiChatController.listSessions);

/**
 * @route   POST /api/v1/ai/chat/sessions
 * @desc    Create a new chat session
 */
router.post('/sessions', writeLimiter, aiChatController.createSession);

/**
 * @route   GET /api/v1/ai/chat/sessions/latest
 * @desc    Get or create the latest chat session
 */
router.get('/sessions/latest', readLimiter, aiChatController.getOrCreateSession);

/**
 * @route   GET /api/v1/ai/chat/sessions/:id
 * @desc    Get a single chat session with details/messages
 */
router.get('/sessions/:id', readLimiter, aiChatController.getSession);

/**
 * @route   DELETE /api/v1/ai/chat/sessions/:id
 * @desc    Delete a chat session
 */
router.delete('/sessions/:id', writeLimiter, aiChatController.deleteSession);

/**
 * @route   POST /api/v1/ai/chat/sessions/:id/message
 * @desc    Send a message and stream the assistant's response back via SSE
 */
router.post('/sessions/:id/message', writeLimiter, aiChatController.sendMessage);

module.exports = router;
