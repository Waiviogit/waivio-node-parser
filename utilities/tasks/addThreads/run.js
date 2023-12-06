const addThreads = require('./addThreads');

(async () => {
  await addThreads({
    author: process.argv[2],
  });
  process.exit();
})();
