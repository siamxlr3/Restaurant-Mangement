require('dotenv').config();
const reorderService = require('../src/services/reorder.service');

async function run() {
    console.log('Triggering AI Reorder prediction calculations...');
    try {
        const result = await reorderService.runReorderPredictionJob();
        console.log('Success! Result:', result);
        process.exit(0);
    } catch (err) {
        console.error('Error running reorder prediction:', err);
        process.exit(1);
    }
}

run();
