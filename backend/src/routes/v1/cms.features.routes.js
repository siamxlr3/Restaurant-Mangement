const express = require('express');
const router = express.Router();
const controller = require('../../controllers/cms.features.controller');
const { createFeatureSchema, updateFeatureSchema } = require('../../validators/cms.features.validator');
const validate = require('../../middlewares/validate');
const { cmsReadLimiter, cmsWriteLimiter } = require('../../middlewares/rateLimiter');

router.get('/',           cmsReadLimiter,  controller.getAll);
router.get('/:id',        cmsReadLimiter,  controller.getById);
router.post('/',          cmsWriteLimiter, validate(createFeatureSchema), controller.create);
router.patch('/reorder',  cmsWriteLimiter, controller.reorder);
router.patch('/:id',      cmsWriteLimiter, validate(updateFeatureSchema), controller.update);
router.delete('/:id',     cmsWriteLimiter, controller.delete);

module.exports = router;
