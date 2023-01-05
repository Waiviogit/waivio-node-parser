const setDepartments = require('./setDepartments');

(async () => {
  await setDepartments();
  process.exit();
})();
