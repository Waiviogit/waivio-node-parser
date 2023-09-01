const duplicateUpdates = require('./duplicateUpdates');

(async () => {
  await duplicateUpdates();
  process.exit();
})();
