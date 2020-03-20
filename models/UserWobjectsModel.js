const { UserWobjects } = require('database').models;

exports.find = async (conditions) => {
  try {
    return { result: await UserWobjects.find(conditions).lean() };
  } catch (error) {
    return { error };
  }
};
