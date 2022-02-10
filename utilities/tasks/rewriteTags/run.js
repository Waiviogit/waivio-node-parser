const rewriteTags = require('./rewriteTags');

(async () => {
  await rewriteTags();
  process.exit();
})();
