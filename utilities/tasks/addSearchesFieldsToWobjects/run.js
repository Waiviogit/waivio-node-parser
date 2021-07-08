const addSearchesFields = require('utilities/tasks/addSearchesFieldsToWobjects/addSearchesFieldsToWobjects');

(async () => {
  await addSearchesFields(process.argv[2]);
  process.exit();
})();
