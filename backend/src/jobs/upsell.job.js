const cron = require('node-cron');
const upsellService = require('../services/upsell.service');

/**
 * Initializes nightly scheduled jobs for the Upsell Engine.
 */
const initUpsellJobs = () => {
    // Run nightly at 02:00 AM
    cron.schedule('0 2 * * *', async () => {
        console.log('[Cron Job] Starting nightly upsell matrix recalculation...');
        try {
            await upsellService.computeCoOccurrenceMatrix();
            console.log('[Cron Job] Nightly upsell matrix recalculation completed.');
        } catch (error) {
            console.error('[Cron Job] Nightly upsell matrix recalculation failed:', error.message);
        }
    });

    console.log('[Cron Job] Upsell Engine nightly job scheduled (02:00 AM)');
};

module.exports = { initUpsellJobs };
