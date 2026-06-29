const recipeService = require('../services/recipe.service');
const { serializeRecipe, serializeRecipeList } = require('../utils/serializers/recipe.serializer');
const { sendResponse, sendError } = require('../utils/apiResponse');

class RecipeController {
    /**
     * GET /api/v1/recipes
     */
    async getAll(req, res, next) {
        try {
            const { page, per_page, search } = req.query;
            const { data, meta } = await recipeService.getAllRecipes({ page, per_page, search });
            return sendResponse(res, 200, true, 'Recipes retrieved successfully', serializeRecipeList(data), meta);
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/recipes/:item_id
     */
    async getByItemId(req, res, next) {
        try {
            const recipe = await recipeService.getRecipeByItemId(req.params.item_id);
            if (!recipe) return sendError(res, 404, 'Recipe not found');
            return sendResponse(res, 200, true, 'Recipe retrieved successfully', serializeRecipe(recipe));
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/v1/recipes/:item_id — upsert recipe
     */
    async upsert(req, res, next) {
        try {
            const { ingredients } = req.body;
            const recipe = await recipeService.upsertRecipe(req.params.item_id, ingredients);
            return sendResponse(res, 201, true, 'Recipe saved successfully', serializeRecipe(recipe));
        } catch (error) {
            if (error.statusCode === 404) return sendError(res, 404, error.message);
            if (error.statusCode === 422) return sendError(res, 422, error.message);
            next(error);
        }
    }

    /**
     * DELETE /api/v1/recipes/:item_id
     */
    async delete(req, res, next) {
        try {
            await recipeService.deleteRecipeByItemId(req.params.item_id);
            return sendResponse(res, 200, true, 'Recipe deleted successfully');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new RecipeController();
