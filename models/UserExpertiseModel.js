const { UserExpertise } = require('database').models;

exports.find = async (condition) => {
  try {
    return { result: await UserExpertise.find(condition).lean() };
  } catch (error) {
    return { error };
  }
};

exports.updateOne = async (condition, updateData, options) => {
  try {
    return { result: await UserExpertise.updateOne(condition, updateData, options) };
  } catch (error) {
    return { error };
  }
};
