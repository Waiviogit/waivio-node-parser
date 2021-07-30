const addMissingTags = require('utilities/tasks/addMissingTags/addMissingTags');

(async () => {
  await addMissingTags(process.argv[2]);
  process.exit();
})();
