const express = require('express');
const router = express.Router();
const multer = require('multer');
const controller = require('../../controllers/cms.featuredDishes.controller');
const { createFeaturedDishSchema, updateFeaturedDishSchema } = require('../../validators/cms.featuredDishes.validator');
const validate = require('../../middlewares/validate');
const { cmsReadLimiter, cmsWriteLimiter } = require('../../middlewares/rateLimiter');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype) ? cb(null, true) : cb(new Error('Invalid file type'));
    },
});

router.get('/',           cmsReadLimiter,  controller.getAll);
router.get('/:id',        cmsReadLimiter,  controller.getById);
router.post('/',          cmsWriteLimiter, upload.single('image'), validate(createFeaturedDishSchema), controller.create);
router.patch('/reorder',  cmsWriteLimiter, controller.reorder);
router.patch('/:id',      cmsWriteLimiter, upload.single('image'), validate(updateFeaturedDishSchema), controller.update);
router.delete('/:id',     cmsWriteLimiter, controller.delete);

module.exports = router;
