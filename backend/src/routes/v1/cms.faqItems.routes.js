const express = require('express');
const router = express.Router();
const controller = require('../../controllers/cms.faqItems.controller');
const { createFaqItemSchema, updateFaqItemSchema } = require('../../validators/cms.faqItems.validator');
const validate = require('../../middlewares/validate');
const { cmsReadLimiter, cmsWriteLimiter } = require('../../middlewares/rateLimiter');

router.get('/',           cmsReadLimiter,  controller.getAll);
router.get('/:id',        cmsReadLimiter,  controller.getById);
router.post('/',          cmsWriteLimiter, validate(createFaqItemSchema), controller.create);
router.patch('/reorder',  cmsWriteLimiter, controller.reorder);
router.patch('/:id',      cmsWriteLimiter, validate(updateFaqItemSchema), controller.update);
router.delete('/:id',     cmsWriteLimiter, controller.delete);

module.exports = router;
