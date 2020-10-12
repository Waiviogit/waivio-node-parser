const addTagCategory = require('utilities/tasks/addTagCategories/addTagCategoryToItems');

(async () => {
  await addTagCategory();
  process.exit();
})();
