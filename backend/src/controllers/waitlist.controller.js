const waitlistService = require('../services/waitlist.service');
const { serializeWaitlist, serializeWaitlists } = require('../utils/serializers/waitlist.serializer');
const { sendResponse, sendError } = require('../utils/apiResponse');

class WaitlistController {
    /**
     * GET /api/v1/waitlist
     */
    async index(req, res, next) {
        try {
            const filters = {
                page: req.query.page,
                per_page: req.query.per_page,
                search: req.query.search,
                status: req.query.status,
                from_date: req.query.from_date,
                to_date: req.query.to_date,
            };

            const result = await waitlistService.getAllWaitlists(filters);

            return sendResponse(
                res,
                200,
                true,
                'Waitlist entries retrieved successfully',
                serializeWaitlists(result.items),
                {
                    page: result.page,
                    per_page: result.per_page,
                    total: result.total,
                    total_pages: result.total_pages,
                }
            );
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/waitlist/:id
     */
    async show(req, res, next) {
        try {
            const item = await waitlistService.getWaitlistById(req.params.id);
            return sendResponse(
                res,
                200,
                true,
                'Waitlist entry retrieved successfully',
                serializeWaitlist(item)
            );
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/v1/waitlist
     */
    async store(req, res, next) {
        try {
            const entry = await waitlistService.createWaitlist(req.body);
            return sendResponse(
                res,
                201,
                true,
                'Walk-in guest added to waitlist successfully',
                serializeWaitlist(entry)
            );
        } catch (error) {
            next(error);
        }
    }

    /**
     * PATCH /api/v1/waitlist/:id/status
     */
    async updateStatus(req, res, next) {
        try {
            const entry = await waitlistService.updateWaitlistStatus(req.params.id, req.body);
            return sendResponse(
                res,
                200,
                true,
                `Waitlist status updated to ${req.body.status}`,
                serializeWaitlist(entry)
            );
        } catch (error) {
            next(error);
        }
    }

    /**
     * DELETE /api/v1/waitlist/:id
     */
    async destroy(req, res, next) {
        try {
            await waitlistService.softDeleteWaitlist(req.params.id);
            return sendResponse(
                res,
                200,
                true,
                'Waitlist entry deleted successfully'
            );
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new WaitlistController();
