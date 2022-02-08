const { UserWobjects } = require('database').models;

exports.find = async (condition) => {
  try {
    return { result: await UserWobjects.find(condition).lean() };
  } catch (error) {
    return { error };
  }
};

exports.updateOne = async (condition, updateData, options) => {
  try {
    return { result: await UserWobjects.updateOne(condition, updateData, options) };
  } catch (error) {
    return { error };
  }
};
