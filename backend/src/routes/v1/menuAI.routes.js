const express = require('express');
const router = express.Router();
const menuAIController = require('../../controllers/menuAI.controller');
const { readLimiter, writeLimiter } = require('../../middlewares/rateLimiter');

// ── Suggestions ──────────────────────────────────────────────────────────────

/**
 * @route   GET /api/v1/ai/menu-suggestions
 * @desc    Get paginated AI menu suggestions (filters: action, is_applied, from_date, to_date, search)
 */
router.get('/menu-suggestions', readLimiter, menuAIController.getSuggestions);

/**
 * @route   GET /api/v1/ai/menu-suggestions/stats
 * @desc    Get aggregate stats (total, pending, applied)
 */
router.get('/menu-suggestions/stats', readLimiter, menuAIController.getSuggestionStats);

/**
 * @route   POST /api/v1/ai/menu-suggestions/trigger
 * @desc    Manually trigger the weekly AI analysis job
 */
router.post('/menu-suggestions/trigger', writeLimiter, menuAIController.triggerJob);

/**
 * @route   PATCH /api/v1/ai/menu-suggestions/:id/apply
 * @desc    Apply a suggestion (mark is_applied = true)
 */
router.patch('/menu-suggestions/:id/apply', writeLimiter, menuAIController.applySuggestion);

/**
 * @route   PATCH /api/v1/ai/menu-suggestions/:id/dismiss
 * @desc    Dismiss (delete) a suggestion
 */
router.patch('/menu-suggestions/:id/dismiss', writeLimiter, menuAIController.dismissSuggestion);

// ── Insights ─────────────────────────────────────────────────────────────────

/**
 * @route   GET /api/v1/ai/insights
 * @desc    Get paginated AI insights (filters: feature, is_read, is_dismissed, from_date, to_date)
 */
router.get('/insights', readLimiter, menuAIController.getInsights);

/**
 * @route   PATCH /api/v1/ai/insights/:id/read
 * @desc    Mark an insight as read
 */
router.patch('/insights/:id/read', writeLimiter, menuAIController.markInsightRead);

/**
 * @route   PATCH /api/v1/ai/insights/:id/dismiss
 * @desc    Dismiss an insight
 */
router.patch('/insights/:id/dismiss', writeLimiter, menuAIController.dismissInsight);

module.exports = router;
