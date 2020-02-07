const wobjectOperations = require('utilities/tasks/appendWobjectFields/wobjectsOperations');

(async () => {
  await wobjectOperations.appendFields();
  process.exit();
})();
