const { deleteSpamPosts } = require('./deleteBadPosts');

(async () => {
  await deleteSpamPosts();
  process.exit();
})();
