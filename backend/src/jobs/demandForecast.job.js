const cron = require('node-cron');
const demandForecastService = require('../services/demandForecast.service');

/**
 * Initializes nightly scheduled jobs for the Demand Forecasting Engine.
 */
const initDemandForecastJobs = () => {
    // Run nightly at 04:00 AM
    cron.schedule('0 4 * * *', async () => {
        console.log('[Cron Job] Starting nightly demand forecasting calculations...');
        try {
            const result = await demandForecastService.runDemandForecastingJob();
            console.log(`[Cron Job] Nightly demand forecasting completed. Processed ${result.recordsProcessed} forecasts.`);
        } catch (error) {
            console.error('[Cron Job] Nightly demand forecasting calculations failed:', error.message);
        }
    });

    console.log('[Cron Job] Demand Forecasting nightly job scheduled (04:00 AM)');
};

module.exports = { initDemandForecastJobs };
