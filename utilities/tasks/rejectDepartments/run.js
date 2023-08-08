const rejectDepartments = require('./rejectDepartments');

(async () => {
  await rejectDepartments();
  process.exit();
})();
