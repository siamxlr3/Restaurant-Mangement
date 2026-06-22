const modifierService = require('../services/modifier.service');
const { serializeModifier, serializeModifierList } = require('../utils/serializers/modifier.serializer');
const { sendResponse, sendError } = require('../utils/apiResponse');

class ModifierController {
    /**
     * Get all modifiers
     */
    async getAll(req, res, next) {
        try {
            const { page, per_page, search, from_date, to_date } = req.query;
            const { data, meta } = await modifierService.getAll({ 
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
                'Modifiers retrieved successfully', 
                serializeModifierList(data), 
                meta
            );
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get modifiers by item ID
     */
    async getByItemId(req, res, next) {
        try {
            const { itemId } = req.params;
            const data = await modifierService.getByItemId(itemId);
            return sendResponse(res, 200, true, 'Modifiers retrieved successfully', serializeModifierList(data));
        } catch (error) {
            next(error);
        }
    }

    /**
     * Create modifier
     */
    async create(req, res, next) {
        try {
            const modifierData = req.body;
            const data = await modifierService.create(modifierData);
            return sendResponse(res, 201, true, 'Modifier created successfully', serializeModifier(data));
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update modifier
     */
    async update(req, res, next) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            const data = await modifierService.update(id, updateData);
            
            if (!data) {
                return sendError(res, 404, 'Modifier not found');
            }

            return sendResponse(res, 200, true, 'Modifier updated successfully', serializeModifier(data));
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete modifier
     */
    async delete(req, res, next) {
        try {
            const { id } = req.params;
            await modifierService.delete(id);
            return sendResponse(res, 200, true, 'Modifier deleted successfully');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ModifierController();
