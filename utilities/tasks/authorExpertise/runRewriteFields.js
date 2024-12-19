const rewriteFields = require('./rewriteFields');

(async () => {
  await rewriteFields();
  process.exit();
})();
