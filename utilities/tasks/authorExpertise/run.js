const rewriteExpertise = require('./authorExpertise');

(async () => {
  await rewriteExpertise();
  process.exit();
})();
