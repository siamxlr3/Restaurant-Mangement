const staffService = require('../services/staff.service');
const staffSerializer = require('../utils/serializers/staff.serializer');
const { sendResponse, sendError } = require('../utils/apiResponse');

/**
 * Controller for handling staff requests.
 */
class StaffController {
    /**
     * Create a new staff member.
     */
    async create(req, res) {
        try {
            const imageBuffer = req.file ? req.file.buffer : null;
            const imageName = req.file ? req.file.originalname : null;

            const staff = await staffService.createStaff(req.body, imageBuffer, imageName);
            return sendResponse(
                res,
                201,
                true,
                'Staff created successfully',
                staffSerializer.map(staff)
            );
        } catch (error) {
            return sendError(res, 400, error.message);
        }
    }

    /**
     * Get a list of all staff.
     */
    async getAll(req, res) {
        try {
            const { items, total, page, per_page, total_pages } = await staffService.listStaff(req.query);
            return sendResponse(
                res,
                200,
                true,
                'Staff list retrieved successfully',
                staffSerializer.mapMany(items),
                { total, page, per_page, total_pages }
            );
        } catch (error) {
            return sendError(res, 500, error.message);
        }
    }

    /**
     * Get a single staff member by ID.
     */
    async getById(req, res) {
        try {
            const staff = await staffService.getStaffById(req.params.id);
            return sendResponse(
                res,
                200,
                true,
                'Staff retrieved successfully',
                staffSerializer.map(staff)
            );
        } catch (error) {
            return sendError(res, 404, error.message);
        }
    }

    /**
     * Update a staff member's details.
     */
    async update(req, res) {
        try {
            const imageBuffer = req.file ? req.file.buffer : null;
            const imageName = req.file ? req.file.originalname : null;

            const staff = await staffService.updateStaff(req.params.id, req.body, imageBuffer, imageName);
            return sendResponse(
                res,
                200,
                true,
                'Staff updated successfully',
                staffSerializer.map(staff)
            );
        } catch (error) {
            return sendError(res, 400, error.message);
        }
    }

    /**
     * Delete a staff member (soft delete).
     */
    async delete(req, res) {
        try {
            await staffService.deleteStaff(req.params.id);
            return sendResponse(res, 200, true, 'Staff deleted successfully');
        } catch (error) {
            return sendError(res, 400, error.message);
        }
    }
}

module.exports = new StaffController();
