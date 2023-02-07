const addSearchesFields = require('./addSearchesFieldsToDepartments');

(async () => {
  await addSearchesFields();
  process.exit();
})();
