const { addToRelatedFromObjects } = require('utilities/tasks/addToRelated/addToRelated');

(async () => {
  await addToRelatedFromObjects();
  console.log('TASK FINISHED');
  process.exit();
})();
