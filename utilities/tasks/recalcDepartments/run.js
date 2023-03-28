const recalcDepartments = require('./recalcDepartments');

(async () => {
  await recalcDepartments();
  process.exit();
})();
