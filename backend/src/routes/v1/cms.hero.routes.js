const express = require('express');
const router = express.Router();
const controller = require('../../controllers/cms.hero.controller');
const { updateHeroSchema } = require('../../validators/cms.hero.validator');
const validate = require('../../middlewares/validate');
const { cmsReadLimiter, cmsWriteLimiter } = require('../../middlewares/rateLimiter');

router.get('/', cmsReadLimiter,  controller.get);
router.put('/', cmsWriteLimiter, validate(updateHeroSchema), controller.upsert);

module.exports = router;
