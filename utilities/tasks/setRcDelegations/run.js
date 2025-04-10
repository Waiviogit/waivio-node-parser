const setRcDelegations = require('./setRcDelegations');

(async () => {
  await setRcDelegations();
  process.exit();
})();
