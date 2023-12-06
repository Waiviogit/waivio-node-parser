const { Threads } = require('database').models;

exports.updateOne = async ({ filter, update, options }) => {
  try {
    return { result: await Threads.updateOne(filter, update, options) };
  } catch (error) {
    return { error };
  }
};

exports.findOne = async ({ filter, projection, options }) => {
  try {
    return { result: await Threads.findOne(filter, projection, options).lean() };
  } catch (error) {
    return { error };
  }
};
