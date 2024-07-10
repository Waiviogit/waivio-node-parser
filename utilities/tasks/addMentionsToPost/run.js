const addMentionsToPost = require('./addMentionsToPost');

(async () => {
  await addMentionsToPost();
  process.exit();
})();
