const { fillRelated } = require('utilities/tasks/addToRelated/addToRelated');

(async () => {
  await fillRelated();
  process.exit();
})();
