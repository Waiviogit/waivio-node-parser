const { CronJob } = require( 'cron' );
const { unusedKeysCollector } = require( '../redis' );

/**
 * Cron to delete unused redis references once per day
 */
const job = new CronJob( '0 0 * * *', async () => {
    console.log( 'Start deleting unused redis CommentsRefs' );
    unusedKeysCollector.deleteUnusedCommentRefs();
}, null, false, null, null, true );

job.start();
