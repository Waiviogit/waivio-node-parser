const addObjectTypes = require('./addObjectTypeToPost');

(async () => {
  await addObjectTypes();
  process.exit();
})();
