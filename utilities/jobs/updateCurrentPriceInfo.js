const { CronJob } = require('cron');
const { updatePriceInfo } = require('utilities/redis');

/**
 * Cron to update price info
 */
const job = new CronJob('*/1 * * * *', async () => {
  await updatePriceInfo.update();
  await updatePriceInfo.setDynamicGlobalProperties();
}, null, false, null, null, true);

job.start();
