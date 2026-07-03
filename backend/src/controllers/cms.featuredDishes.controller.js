const dishesService = require('../services/cms.featuredDishes.service');
const DishesSerializer = require('../utils/serializers/cms.featuredDishes.serializer');
const { sendResponse, sendError } = require('../utils/apiResponse');

class CmsFeaturedDishesController {
    async getAll(req, res) {
        try {
            const { items, total, page, per_page, total_pages } = await dishesService.getAll(req.query);
            return sendResponse(res, 200, true, 'Featured dishes retrieved', DishesSerializer.mapMany(items), { total, page, per_page, total_pages });
        } catch (err) { return sendError(res, 500, err.message); }
    }
    async getById(req, res) {
        try {
            const data = await dishesService.getById(req.params.id);
            return sendResponse(res, 200, true, 'Featured dish retrieved', DishesSerializer.map(data));
        } catch (err) { return sendError(res, 404, err.message); }
    }
    async create(req, res) {
        try {
            const imageBuffer = req.file?.buffer ?? null;
            const imageName   = req.file?.originalname ?? null;
            const data = await dishesService.create(req.body, imageBuffer, imageName);
            return sendResponse(res, 201, true, 'Featured dish created', DishesSerializer.map(data));
        } catch (err) { return sendError(res, 400, err.message); }
    }
    async update(req, res) {
        try {
            const imageBuffer = req.file?.buffer ?? null;
            const imageName   = req.file?.originalname ?? null;
            const data = await dishesService.update(req.params.id, req.body, imageBuffer, imageName);
            return sendResponse(res, 200, true, 'Featured dish updated', DishesSerializer.map(data));
        } catch (err) { return sendError(res, 400, err.message); }
    }
    async delete(req, res) {
        try {
            await dishesService.delete(req.params.id);
            return sendResponse(res, 200, true, 'Featured dish deleted');
        } catch (err) { return sendError(res, 400, err.message); }
    }
    async reorder(req, res) {
        try {
            await dishesService.reorder(req.body.ids);
            return sendResponse(res, 200, true, 'Featured dishes reordered');
        } catch (err) { return sendError(res, 400, err.message); }
    }
}
module.exports = new CmsFeaturedDishesController();
