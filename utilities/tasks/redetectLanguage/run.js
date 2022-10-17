const reDetectLanguage = require('./reDetectLanguage');

(async () => {
  await reDetectLanguage();
  process.exit();
})();
