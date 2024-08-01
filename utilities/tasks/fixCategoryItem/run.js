const fixCategoryItem = require('./fixCategoryItem');

(async () => {
  await fixCategoryItem();
  process.exit();
})();
