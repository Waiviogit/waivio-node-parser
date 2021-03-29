const addMissingPostsToUser = require('utilities/tasks/addMissingPostsToUser/addMissingPostsToUser');

(async () => {
  await addMissingPostsToUser();
  process.exit();
})();
