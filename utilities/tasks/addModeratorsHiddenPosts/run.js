const addModeratorsHiddenPosts = require('./addModeratorsHiddenPosts');

(async () => {
  await addModeratorsHiddenPosts();
  process.exit();
})();
