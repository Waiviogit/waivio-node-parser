const pullDepartments = require('./pullDepartments');

(async () => {
  await pullDepartments();
  process.exit();
})();
