const express = require('express');
const router = express.Router();
const controller = require('../../controllers/cms.openingHours.controller');
const { createOpeningHourSchema, updateOpeningHourSchema } = require('../../validators/cms.openingHours.validator');
const validate = require('../../middlewares/validate');
const { cmsReadLimiter, cmsWriteLimiter } = require('../../middlewares/rateLimiter');

router.get('/',       cmsReadLimiter,  controller.getAll);
router.get('/:id',    cmsReadLimiter,  controller.getById);
router.post('/',      cmsWriteLimiter, validate(createOpeningHourSchema), controller.create);
router.patch('/:id',  cmsWriteLimiter, validate(updateOpeningHourSchema), controller.update);
router.delete('/:id', cmsWriteLimiter, controller.delete);

module.exports = router;
