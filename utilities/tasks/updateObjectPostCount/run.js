const updateObjectPostCount = require('./updateObjectPostCount');

(async () => {
  console.log('task started');
  await updateObjectPostCount();
  console.log('task finished');
  process.exit();
})();
