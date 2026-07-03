const express = require('express');
const router = express.Router();
const controller = require('../../controllers/cms.tickerItems.controller');
const { createTickerItemSchema, updateTickerItemSchema } = require('../../validators/cms.tickerItems.validator');
const validate = require('../../middlewares/validate');
const { cmsReadLimiter, cmsWriteLimiter } = require('../../middlewares/rateLimiter');

router.get('/',           cmsReadLimiter,  controller.getAll);
router.get('/:id',        cmsReadLimiter,  controller.getById);
router.post('/',          cmsWriteLimiter, validate(createTickerItemSchema), controller.create);
router.patch('/reorder',  cmsWriteLimiter, controller.reorder);
router.patch('/:id',      cmsWriteLimiter, validate(updateTickerItemSchema), controller.update);
router.delete('/:id',     cmsWriteLimiter, controller.delete);

module.exports = router;
