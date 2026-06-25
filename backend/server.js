require('dotenv').config();
const app = require('./src/app');

const { initUpsellJobs } = require('./src/jobs/upsell.job');

const PORT = process.env.PORT || 5000;

initUpsellJobs();

app.listen(PORT, () => {
    console.log(`[SERVER] Running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
