const { updatePayouts } = require('./updatePayouts');

(async () => {
  await updatePayouts();
  process.exit();
})();
