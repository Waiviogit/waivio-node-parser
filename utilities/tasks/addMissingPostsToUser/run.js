const addMissingPostsToUser = require('utilities/tasks/addMissingPostsToUser/addMissingPostsToUser');

(async () => {
  await addMissingPostsToUser(process.argv[2]);
  process.exit();
})();
