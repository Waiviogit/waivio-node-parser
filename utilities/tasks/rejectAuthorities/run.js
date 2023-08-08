const rejectAuthorities = require('./rejectAuthorities');

(async () => {
  await rejectAuthorities();
  process.exit();
})();
