const express = require('express');
const router = express.Router();
const testController = require('../controllers/test.controller');

router.get('/', testController.getTestData);
router.post('/', testController.createTestData);

module.exports = router;
