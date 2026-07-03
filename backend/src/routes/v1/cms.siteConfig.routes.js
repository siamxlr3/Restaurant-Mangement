const express = require('express');
const router = express.Router();
const multer = require('multer');
const controller = require('../../controllers/cms.siteConfig.controller');
const { updateSiteConfigSchema } = require('../../validators/cms.siteConfig.validator');
const validate = require('../../middlewares/validate');
const { cmsReadLimiter, cmsWriteLimiter } = require('../../middlewares/rateLimiter');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp'];
        allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Invalid file type'));
    },
});

router.get('/', cmsReadLimiter, controller.get);
router.put('/', cmsWriteLimiter, upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'favicon', maxCount: 1 }]), validate(updateSiteConfigSchema), controller.upsert);

module.exports = router;
