const express = require('express');
const router = express.Router();
const controller = require('../../controllers/cms.story.controller');
const { updateStorySchema } = require('../../validators/cms.story.validator');
const validate = require('../../middlewares/validate');
const { cmsReadLimiter, cmsWriteLimiter } = require('../../middlewares/rateLimiter');

router.get('/', cmsReadLimiter,  controller.get);
router.put('/', cmsWriteLimiter, validate(updateStorySchema), controller.upsert);

module.exports = router;
