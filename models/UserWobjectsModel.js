const { UserWobjects } = require('database').models;

exports.find = async (condition) => {
  try {
    return { result: await UserWobjects.find(condition).lean() };
  } catch (error) {
    return { error };
  }
};
