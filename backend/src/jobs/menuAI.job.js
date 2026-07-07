const cron = require('node-cron');
const menuAIService = require('../services/menuAI.service');

/**
 * Initializes the weekly scheduled job for Menu Performance AI Analysis.
 */
const initMenuAIJobs = () => {
    // Run every Sunday at 03:00 AM
    cron.schedule('0 3 * * 0', async () => {
        console.log('[Cron Job] Starting weekly Menu AI analysis...');
        try {
            const result = await menuAIService.runMenuAIJob();
            console.log(`[Cron Job] Weekly Menu AI completed. Generated ${result.recordsProcessed} suggestions.`);
        } catch (error) {
            console.error('[Cron Job] Weekly Menu AI analysis failed:', error.message);
        }
    });

    console.log('[Cron Job] Menu AI weekly job scheduled (Sunday 03:00 AM)');
};

module.exports = { initMenuAIJobs };
