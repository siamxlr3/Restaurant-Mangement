const cron = require('node-cron');
const reorderService = require('../services/reorder.service');

/**
 * Initializes nightly scheduled jobs for the Reorder Suggestions Engine.
 */
const initReorderJobs = () => {
    // Run nightly at 03:00 AM
    cron.schedule('0 3 * * *', async () => {
        console.log('[Cron Job] Starting nightly reorder suggestion calculations...');
        try {
            const result = await reorderService.runReorderPredictionJob();
            console.log(`[Cron Job] Nightly reorder calculations completed. Processed ${result.recordsProcessed} suggestions.`);
        } catch (error) {
            console.error('[Cron Job] Nightly reorder calculations failed:', error.message);
        }
    });

    console.log('[Cron Job] Reorder Suggestions nightly job scheduled (03:00 AM)');
};

module.exports = { initReorderJobs };
