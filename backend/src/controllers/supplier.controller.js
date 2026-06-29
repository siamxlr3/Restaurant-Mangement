const supplierService = require('../services/supplier.service');
const { serializeSupplier, serializeSupplierList } = require('../utils/serializers/supplier.serializer');
const { sendResponse, sendError } = require('../utils/apiResponse');

class SupplierController {
    /**
     * GET /api/v1/suppliers
     */
    async getAll(req, res, next) {
        try {
            const { page, per_page, search, status, from_date, to_date } = req.query;
            const { data, meta } = await supplierService.getAllSuppliers({
                page, per_page, search, status, from_date, to_date,
            });
            return sendResponse(res, 200, true, 'Suppliers retrieved successfully', serializeSupplierList(data), meta);
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/suppliers/:id
     */
    async getById(req, res, next) {
        try {
            const supplier = await supplierService.getSupplierById(req.params.id);
            if (!supplier) return sendError(res, 404, 'Supplier not found');
            return sendResponse(res, 200, true, 'Supplier retrieved successfully', serializeSupplier(supplier));
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/v1/suppliers
     */
    async create(req, res, next) {
        try {
            const supplier = await supplierService.createSupplier(req.body);
            return sendResponse(res, 201, true, 'Supplier created successfully', serializeSupplier(supplier));
        } catch (error) {
            if (error.statusCode === 409) return sendError(res, 409, error.message);
            next(error);
        }
    }

    /**
     * PATCH /api/v1/suppliers/:id
     */
    async update(req, res, next) {
        try {
            const supplier = await supplierService.updateSupplier(req.params.id, req.body);
            if (!supplier) return sendError(res, 404, 'Supplier not found');
            return sendResponse(res, 200, true, 'Supplier updated successfully', serializeSupplier(supplier));
        } catch (error) {
            if (error.statusCode === 409) return sendError(res, 409, error.message);
            next(error);
        }
    }

    /**
     * DELETE /api/v1/suppliers/:id
     */
    async delete(req, res, next) {
        try {
            await supplierService.softDeleteSupplier(req.params.id);
            return sendResponse(res, 200, true, 'Supplier deleted successfully');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new SupplierController();
