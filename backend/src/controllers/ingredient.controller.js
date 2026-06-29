const ingredientService = require('../services/ingredient.service');
const { serializeIngredient, serializeIngredientList } = require('../utils/serializers/ingredient.serializer');
const { sendResponse, sendError } = require('../utils/apiResponse');

class IngredientController {
    /**
     * GET /api/v1/ingredients
     */
    async getAll(req, res, next) {
        try {
            const { page, per_page, search, status, from_date, to_date } = req.query;
            const { data, meta } = await ingredientService.getAllIngredients({
                page, per_page, search, status, from_date, to_date,
            });
            return sendResponse(res, 200, true, 'Ingredients retrieved successfully', serializeIngredientList(data), meta);
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/ingredients/low-stock
     */
    async getLowStock(req, res, next) {
        try {
            const data = await ingredientService.getLowStockIngredients();
            return sendResponse(res, 200, true, 'Low stock ingredients retrieved', serializeIngredientList(data));
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/ingredients/:id
     */
    async getById(req, res, next) {
        try {
            const ingredient = await ingredientService.getIngredientById(req.params.id);
            if (!ingredient) return sendError(res, 404, 'Ingredient not found');
            return sendResponse(res, 200, true, 'Ingredient retrieved successfully', serializeIngredient(ingredient));
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/v1/ingredients
     */
    async create(req, res, next) {
        try {
            const ingredient = await ingredientService.createIngredient(req.body);
            return sendResponse(res, 201, true, 'Ingredient created successfully', serializeIngredient(ingredient));
        } catch (error) {
            if (error.statusCode === 409) return sendError(res, 409, error.message);
            next(error);
        }
    }

    /**
     * PATCH /api/v1/ingredients/:id
     */
    async update(req, res, next) {
        try {
            const ingredient = await ingredientService.updateIngredient(req.params.id, req.body);
            if (!ingredient) return sendError(res, 404, 'Ingredient not found');
            return sendResponse(res, 200, true, 'Ingredient updated successfully', serializeIngredient(ingredient));
        } catch (error) {
            if (error.statusCode === 409) return sendError(res, 409, error.message);
            next(error);
        }
    }

    /**
     * PATCH /api/v1/ingredients/:id/adjust-stock
     */
    async adjustStock(req, res, next) {
        try {
            const { delta, reason, adjusted_by } = req.body;
            const ingredient = await ingredientService.adjustStock(req.params.id, { delta, reason, adjusted_by });
            return sendResponse(res, 200, true, 'Stock adjusted successfully', serializeIngredient(ingredient));
        } catch (error) {
            if (error.statusCode === 404) return sendError(res, 404, error.message);
            if (error.statusCode === 422) return sendError(res, 422, error.message);
            next(error);
        }
    }

    /**
     * DELETE /api/v1/ingredients/:id
     */
    async delete(req, res, next) {
        try {
            await ingredientService.softDeleteIngredient(req.params.id);
            return sendResponse(res, 200, true, 'Ingredient deleted successfully');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new IngredientController();
