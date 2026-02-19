const { restoreUserPosts, restoreAllSpamUsersPosts } = require('../../moderation/restoreSpamPosts');

const userName = process.argv[2];

(async () => {
  if (userName) {
    console.log(`Restoring single user: ${userName}`);
    await restoreUserPosts(userName);
  } else {
    await restoreAllSpamUsersPosts();
  }
  process.exit();
})();
