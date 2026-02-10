const { deleteBadPosts } = require('./deleteBadPosts');

(async () => {
  await deleteBadPosts();
  process.exit();
})();
