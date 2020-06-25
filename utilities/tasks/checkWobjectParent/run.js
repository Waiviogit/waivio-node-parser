const wobjectOperations = require('utilities/tasks/checkWobjectParent/wobjectOperations');

(async () => {
  await wobjectOperations.checkParent();
  process.exit();
})();
