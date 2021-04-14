const { addObjectType } = require('./addObjectTypeToPost');

(async () => {
  await addObjectType();
  process.exit();
})();
