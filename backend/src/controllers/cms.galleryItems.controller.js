const galleryService = require('../services/cms.galleryItems.service');
const GallerySerializer = require('../utils/serializers/cms.galleryItems.serializer');
const { sendResponse, sendError } = require('../utils/apiResponse');

class CmsGalleryItemsController {
    async getAll(req, res) {
        try {
            const { items, total, page, per_page, total_pages } = await galleryService.getAll(req.query);
            return sendResponse(res, 200, true, 'Gallery items retrieved', GallerySerializer.mapMany(items), { total, page, per_page, total_pages });
        } catch (err) { return sendError(res, 500, err.message); }
    }
    async getById(req, res) {
        try {
            const data = await galleryService.getById(req.params.id);
            return sendResponse(res, 200, true, 'Gallery item retrieved', GallerySerializer.map(data));
        } catch (err) { return sendError(res, 404, err.message); }
    }
    async create(req, res) {
        try {
            const data = await galleryService.create(req.body, req.file?.buffer ?? null, req.file?.originalname ?? null);
            return sendResponse(res, 201, true, 'Gallery item created', GallerySerializer.map(data));
        } catch (err) { return sendError(res, 400, err.message); }
    }
    async update(req, res) {
        try {
            const data = await galleryService.update(req.params.id, req.body, req.file?.buffer ?? null, req.file?.originalname ?? null);
            return sendResponse(res, 200, true, 'Gallery item updated', GallerySerializer.map(data));
        } catch (err) { return sendError(res, 400, err.message); }
    }
    async delete(req, res) {
        try {
            await galleryService.delete(req.params.id);
            return sendResponse(res, 200, true, 'Gallery item deleted');
        } catch (err) { return sendError(res, 400, err.message); }
    }
    async reorder(req, res) {
        try {
            await galleryService.reorder(req.body.ids);
            return sendResponse(res, 200, true, 'Gallery items reordered');
        } catch (err) { return sendError(res, 400, err.message); }
    }
}
module.exports = new CmsGalleryItemsController();
