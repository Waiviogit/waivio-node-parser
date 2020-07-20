const { start } = require('./addWalletRecords');

(async () => {
  await start();
  process.exit();
})();
