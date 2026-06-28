const reservationService = require('../services/reservation.service');
const { serializeReservation, serializeReservations } = require('../utils/serializers/reservation.serializer');

class ReservationController {
    /**
     * GET /reservations
     */
    async index(req, res, next) {
        try {
            const filters = {
                page: req.query.page,
                per_page: req.query.per_page,
                search: req.query.search,
                status: req.query.status,
                from_date: req.query.from_date,
                to_date: req.query.to_date,
            };

            const result = await reservationService.getAllReservations(filters);

            return res.status(200).json({
                success: true,
                message: 'Reservations retrieved successfully',
                data: serializeReservations(result.items),
                meta: {
                    page: result.page,
                    per_page: result.per_page,
                    total: result.total,
                    total_pages: result.total_pages,
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /reservations/:id
     */
    async show(req, res, next) {
        try {
            const reservation = await reservationService.getReservationById(req.params.id);
            return res.status(200).json({
                success: true,
                message: 'Reservation retrieved successfully',
                data: serializeReservation(reservation),
                meta: null
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /reservations
     */
    async store(req, res, next) {
        try {
            const reservation = await reservationService.createReservation(req.body);
            return res.status(201).json({
                success: true,
                message: 'Reservation created successfully',
                data: serializeReservation(reservation),
                meta: null
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PATCH /reservations/:id/status
     */
    async updateStatus(req, res, next) {
        try {
            const { status } = req.body;
            const reservation = await reservationService.updateReservationStatus(req.params.id, status);
            return res.status(200).json({
                success: true,
                message: `Reservation status updated to ${status}`,
                data: serializeReservation(reservation),
                meta: null
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * DELETE /reservations/:id
     */
    async destroy(req, res, next) {
        try {
            await reservationService.softDeleteReservation(req.params.id);
            return res.status(200).json({
                success: true,
                message: 'Reservation deleted successfully',
                data: null,
                meta: null
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ReservationController();
