const variantService = require('../services/variant.service');
const { serializeVariant, serializeVariantList } = require('../utils/serializers/variant.serializer');
const { sendResponse, sendError } = require('../utils/apiResponse');

class VariantController {
    /**
     * Get all variants
     */
    async getAll(req, res, next) {
        try {
            const { page, per_page, search, from_date, to_date } = req.query;
            const { data, meta } = await variantService.getAll({ 
                page, 
                per_page, 
                search, 
                from_date, 
                to_date 
            });
            
            return sendResponse(
                res, 
                200, 
                true, 
                'Variants retrieved successfully', 
                serializeVariantList(data), 
                meta
            );
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get variants by item ID
     */
    async getByItemId(req, res, next) {
        try {
            const { itemId } = req.params;
            const data = await variantService.getByItemId(itemId);
            return sendResponse(res, 200, true, 'Variants retrieved successfully', serializeVariantList(data));
        } catch (error) {
            next(error);
        }
    }

    /**
     * Create variant
     */
    async create(req, res, next) {
        try {
            const variantData = req.body;
            const data = await variantService.create(variantData);
            return sendResponse(res, 201, true, 'Variant created successfully', serializeVariant(data));
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update variant
     */
    async update(req, res, next) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            const data = await variantService.update(id, updateData);
            
            if (!data) {
                return sendError(res, 404, 'Variant not found');
            }

            return sendResponse(res, 200, true, 'Variant updated successfully', serializeVariant(data));
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete variant
     */
    async delete(req, res, next) {
        try {
            const { id } = req.params;
            await variantService.delete(id);
            return sendResponse(res, 200, true, 'Variant deleted successfully');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new VariantController();
