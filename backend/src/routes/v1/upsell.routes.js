const express = require('express');
const router = express.Router();
const upsellController = require('../../controllers/upsell.controller');

// Read endpoints
router.get('/recommendations/:itemId', upsellController.getRecommendations);
router.get('/pairs', upsellController.getPairs);

// Write endpoints (recalculate matrix)
router.post('/recalculate', upsellController.recalculate);

module.exports = router;
