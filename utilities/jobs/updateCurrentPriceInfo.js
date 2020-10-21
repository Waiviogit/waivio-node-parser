const { CronJob } = require('cron');
const { updatePriceInfo } = require('utilities/redis');

/**
 * Cron to update price info
 */
const job = new CronJob('*/10 * * * *', async () => {
  await updatePriceInfo.update();
}, null, false, null, null, true);

job.start();
