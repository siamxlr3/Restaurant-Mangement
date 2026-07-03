const express = require('express');
const router = express.Router();
const controller = require('../../controllers/cms.location.controller');
const { updateLocationSchema } = require('../../validators/cms.location.validator');
const validate = require('../../middlewares/validate');
const { cmsReadLimiter, cmsWriteLimiter } = require('../../middlewares/rateLimiter');

router.get('/', cmsReadLimiter,  controller.get);
router.put('/', cmsWriteLimiter, validate(updateLocationSchema), controller.upsert);

module.exports = router;
