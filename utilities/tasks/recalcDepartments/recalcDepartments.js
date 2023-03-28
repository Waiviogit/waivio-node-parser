const { Department, Wobj } = require('models');

const recalcDepartments = async () => {
  const { result: departments } = await Department.find({
    filter: {},
    projection: { name: 1 },
  });
  if (!departments && !departments.length) return;

  for (const department of departments) {
    const { result: objectsCount } = await Wobj.departmentUniqCount(department.name);
    if (!objectsCount) {
      console.error(`${department.name} no objects found`);
      continue;
    }
    await Department.updateOne({
      filter: { name: department.name },
      update: { $set: { objectsCount } },
    });
  }
  console.log('task finished');
};

module.exports = recalcDepartments;
