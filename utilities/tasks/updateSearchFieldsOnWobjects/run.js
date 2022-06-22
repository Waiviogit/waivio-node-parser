const { updateSearchFieldsOnWobjects } = require('./updateSearchFieldsOnWobjects');

(async () => {
  console.log('task started');
  await updateSearchFieldsOnWobjects();
  process.exit();
})();
