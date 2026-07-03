const express = require('express');
const router = express.Router();
const controller = require('../../controllers/cms.reservationConfig.controller');
const { updateReservationConfigSchema } = require('../../validators/cms.reservationConfig.validator');
const validate = require('../../middlewares/validate');
const { cmsReadLimiter, cmsWriteLimiter } = require('../../middlewares/rateLimiter');

router.get('/', cmsReadLimiter,  controller.get);
router.put('/', cmsWriteLimiter, validate(updateReservationConfigSchema), controller.upsert);

module.exports = router;
