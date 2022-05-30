const { updateObjectTypes } = require('./updateObjectTypesExposedFields');

(async () => {
  await updateObjectTypes(process.argv[2], process.argv[3]);
  process.exit();
})();
