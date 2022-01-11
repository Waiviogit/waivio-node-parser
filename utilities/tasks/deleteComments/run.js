const deleteComments = require('./deleteComments');

(async () => {
  await deleteComments();
  process.exit();
})();
