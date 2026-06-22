const itemService = require('../services/item.service');
const { serializeItem, serializeItemList } = require('../utils/serializers/item.serializer');
const { sendResponse, sendError } = require('../utils/apiResponse');

class ItemController {
    /**
     * Get all items
     */
    async getAll(req, res, next) {
        try {
            const { page, per_page, search, status, category_id, from_date, to_date } = req.query;
            const { data, meta } = await itemService.getAllItems({ 
                page, 
                per_page, 
                search, 
                status, 
                category_id, 
                from_date, 
                to_date 
            });
            
            return sendResponse(
                res, 
                200, 
                true, 
                'Items retrieved successfully', 
                serializeItemList(data), 
                meta
            );
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get item by ID
     */
    async getById(req, res, next) {
        try {
            const { id } = req.params;
            const item = await itemService.getItemById(id);
            
            if (!item) {
                return sendError(res, 404, 'Item not found');
            }

            return sendResponse(res, 200, true, 'Item retrieved successfully', serializeItem(item));
        } catch (error) {
            next(error);
        }
    }

    /**
     * Create item
     */
    async create(req, res, next) {
        try {
            const itemData = req.body;

            if (req.file) {
                const imageUrl = await itemService.uploadImage(req.file);
                itemData.image_url = imageUrl;
            }

            const item = await itemService.createItem(itemData);
            return sendResponse(res, 201, true, 'Item created successfully', serializeItem(item));
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update item
     */
    async update(req, res, next) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            if (req.file) {
                const imageUrl = await itemService.uploadImage(req.file);
                updateData.image_url = imageUrl;
            }

            const item = await itemService.updateItem(id, updateData);
            
            if (!item) {
                return sendError(res, 404, 'Item not found');
            }

            return sendResponse(res, 200, true, 'Item updated successfully', serializeItem(item));
        } catch (error) {
            next(error);
        }
    }

    /**
     * Patch availability (86 Feature)
     */
    async patchAvailability(req, res, next) {
        try {
            const { id } = req.params;
            const { is_available } = req.body;

            const item = await itemService.updateAvailability(id, is_available);
            
            if (!item) {
                return sendError(res, 404, 'Item not found');
            }

            return sendResponse(res, 200, true, 'Availability updated successfully', item);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete item
     */
    async delete(req, res, next) {
        try {
            const { id } = req.params;
            await itemService.deleteItem(id);
            return sendResponse(res, 200, true, 'Item deleted successfully');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ItemController();
