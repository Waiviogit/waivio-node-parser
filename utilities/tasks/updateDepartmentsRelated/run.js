const updateDepartmentsRelated = require('./updateDepartmentsRelated');

(async () => {
  console.log('task started');
  await updateDepartmentsRelated();
  console.log('task finished');
  process.exit();
})();
