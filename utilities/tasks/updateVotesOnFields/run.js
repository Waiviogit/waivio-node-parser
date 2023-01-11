const updateVotesOnFields = require('./updateVotesOnFields');

(async () => {
  console.log('task started');
  await updateVotesOnFields();
  console.log('task finished');
  process.exit();
})();
