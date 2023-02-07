const { Department } = require('database').models;
const { parseName } = require('utilities/helpers/updateSpecificFieldsHelper');

module.exports = async () => {
  const departments = await Department.find({ }, { name: 1 }).lean();
  for (const department of departments) {
    const search = parseName(department.name);
    await Department.updateOne({ _id: department._id }, { $set: { search } });
  }
  console.log('task finished');
};
