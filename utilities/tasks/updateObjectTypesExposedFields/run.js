const { updateObjectTypes } = require('./updateObjectTypesExposedFields');

(async () => {
  await updateObjectTypes();
  process.exit();
})();
