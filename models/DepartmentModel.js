const { Department } = require('database').models;

exports.findOneOrCreateByName = async (name) => {
  try {
    const department = await Department.findOne({ name }).lean();
    if (department) return { result: department };
    return { result: (await Department.create({ name })).toObject() };
  } catch (error) {
    return { error };
  }
};

exports.updateOne = async ({ filter, update, options }) => {
  try {
    return { result: await Department.updateOne(filter, update, options) };
  } catch (error) {
    return { error };
  }
};
