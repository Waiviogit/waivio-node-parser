const { Threads } = require('database').models;

exports.updateOne = async ({ filter, update, options }) => {
  try {
    return { result: await Threads.updateOne(filter, update, options) };
  } catch (error) {
    return { error };
  }
};

exports.updateMany = async ({ filter, update, options }) => {
  try {
    return { result: await Threads.updateMany(filter, update, options) };
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

exports.find = async ({ filter, projection, options }) => {
  try {
    return { result: await Threads.find(filter, projection, options) };
  } catch (error) {
    return { error };
  }
};
