const express = require('express');
const router = express.Router();
const multer = require('multer');
const controller = require('../../controllers/cms.galleryItems.controller');
const { createGalleryItemSchema, updateGalleryItemSchema } = require('../../validators/cms.galleryItems.validator');
const validate = require('../../middlewares/validate');
const { cmsReadLimiter, cmsWriteLimiter } = require('../../middlewares/rateLimiter');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB for gallery images
    fileFilter: (req, file, cb) => {
        ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype) ? cb(null, true) : cb(new Error('Invalid file type'));
    },
});

router.get('/',           cmsReadLimiter,  controller.getAll);
router.get('/:id',        cmsReadLimiter,  controller.getById);
router.post('/',          cmsWriteLimiter, upload.single('image'), validate(createGalleryItemSchema), controller.create);
router.patch('/reorder',  cmsWriteLimiter, controller.reorder);
router.patch('/:id',      cmsWriteLimiter, upload.single('image'), validate(updateGalleryItemSchema), controller.update);
router.delete('/:id',     cmsWriteLimiter, controller.delete);

module.exports = router;
