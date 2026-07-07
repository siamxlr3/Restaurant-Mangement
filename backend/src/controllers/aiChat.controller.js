const aiChatService = require('../services/aiChat.service');
const { sendResponse, sendError } = require('../utils/apiResponse');
const { sendMessageSchema, sessionQuerySchema } = require('../validators/aiChat.validator');

class AiChatController {

    /**
     * GET /api/v1/ai/chat/sessions
     * List sessions (paginated).
     */
    async listSessions(req, res, next) {
        try {
            const parsed = sessionQuerySchema.safeParse(req.query);
            if (!parsed.success) {
                return sendError(res, 400, 'Validation error', parsed.error.flatten());
            }
            const { page, per_page, staff_id } = parsed.data;
            const { data, meta } = await aiChatService.listSessions({ staff_id, page, per_page });
            return sendResponse(res, 200, true, 'Sessions retrieved successfully', data, meta);
        } catch (err) {
            next(err);
        }
    }

    /**
     * POST /api/v1/ai/chat/sessions
     * Create a brand-new chat session.
     */
    async createSession(req, res, next) {
        try {
            const staff_id = req.body?.staff_id || null;
            const session = await aiChatService.createSession({ staff_id });
            return sendResponse(res, 201, true, 'Session created successfully', session);
        } catch (err) {
            next(err);
        }
    }

    /**
     * GET /api/v1/ai/chat/sessions/latest
     * Get or create the latest session for a staff member.
     */
    async getOrCreateSession(req, res, next) {
        try {
            const staff_id = req.query.staff_id || null;
            const session = await aiChatService.getOrCreateSession({ staff_id });
            return sendResponse(res, 200, true, 'Session retrieved successfully', session);
        } catch (err) {
            next(err);
        }
    }

    /**
     * GET /api/v1/ai/chat/sessions/:id
     * Get a session by ID.
     */
    async getSession(req, res, next) {
        try {
            const session = await aiChatService.getSession(req.params.id);
            return sendResponse(res, 200, true, 'Session retrieved successfully', session);
        } catch (err) {
            if (err.statusCode === 404) return sendError(res, 404, err.message);
            next(err);
        }
    }

    /**
     * DELETE /api/v1/ai/chat/sessions/:id
     * Hard-delete a session.
     */
    async deleteSession(req, res, next) {
        try {
            await aiChatService.deleteSession(req.params.id);
            return sendResponse(res, 200, true, 'Session deleted successfully');
        } catch (err) {
            next(err);
        }
    }

    /**
     * POST /api/v1/ai/chat/sessions/:id/message
     * Send a message — streams the Claude response back as SSE.
     * NOTE: Response is handled entirely by the service (SSE streaming).
     */
    async sendMessage(req, res, next) {
        try {
            const parsed = sendMessageSchema.safeParse(req.body);
            if (!parsed.success) {
                return sendError(res, 400, 'Validation error', parsed.error.flatten());
            }
            const { message } = parsed.data;
            // The service sets SSE headers and streams; do NOT call next() after this
            await aiChatService.sendMessage(req.params.id, message, res);
        } catch (err) {
            // If headers haven't been sent yet, delegate to error handler
            if (!res.headersSent) {
                if (err.statusCode === 404) return sendError(res, 404, err.message);
                if (err.statusCode === 503) return sendError(res, 503, err.message);
                next(err);
            } else {
                // SSE stream already started — can only log
                console.error('[AI Chat] Error after headers sent:', err.message);
                try {
                    res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
                    res.end();
                } catch (_) { /* ignore */ }
            }
        }
    }
}

module.exports = new AiChatController();
