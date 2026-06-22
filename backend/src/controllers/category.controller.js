const categoryService = require('../services/category.service');
const { serializeCategory, serializeCategoryList } = require('../utils/serializers/category.serializer');
const { sendResponse, sendError } = require('../utils/apiResponse');

class CategoryController {
    /**
     * Get all categories
     */
    async getAll(req, res, next) {
        try {
            const { page, per_page, search, status } = req.query;
            const { data, meta } = await categoryService.getAllCategories({ page, per_page, search, status });
            
            return sendResponse(
                res, 
                200, 
                true, 
                'Categories retrieved successfully', 
                serializeCategoryList(data), 
                meta
            );
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get category by ID
     */
    async getById(req, res, next) {
        try {
            const { id } = req.params;
            const category = await categoryService.getCategoryById(id);
            
            if (!category) {
                return sendError(res, 404, 'Category not found');
            }

            return sendResponse(res, 200, true, 'Category retrieved successfully', serializeCategory(category));
        } catch (error) {
            next(error);
        }
    }

    /**
     * Create category
     */
    async create(req, res, next) {
        try {
            const category = await categoryService.createCategory(req.body);
            return sendResponse(res, 201, true, 'Category created successfully', serializeCategory(category));
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update category
     */
    async update(req, res, next) {
        try {
            const { id } = req.params;
            const category = await categoryService.updateCategory(id, req.body);
            
            if (!category) {
                return sendError(res, 404, 'Category not found');
            }

            return sendResponse(res, 200, true, 'Category updated successfully', serializeCategory(category));
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete category
     */
    async delete(req, res, next) {
        try {
            const { id } = req.params;
            await categoryService.deleteCategory(id);
            return sendResponse(res, 200, true, 'Category deleted successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update sort order
     */
    async updateOrder(req, res, next) {
        try {
            const { items } = req.body;
            if (!Array.isArray(items)) {
                return sendError(res, 400, 'Items array is required');
            }

            await categoryService.updateSortOrder(items);
            return sendResponse(res, 200, true, 'Sort order updated successfully');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new CategoryController();
