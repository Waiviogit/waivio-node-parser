const { updateSpamList } = require('./deleteBadPosts');

(async () => {
  await updateSpamList();
  process.exit();
})();
