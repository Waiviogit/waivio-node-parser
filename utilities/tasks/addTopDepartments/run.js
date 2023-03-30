const addSearchesFields = require('./addTopDepartments');

(async () => {
  await addSearchesFields();
  process.exit();
})();
