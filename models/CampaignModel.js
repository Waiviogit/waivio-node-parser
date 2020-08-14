const { Campaign } = require('database').models;

exports.findOne = async (condition, select) => {
  try {
    return { result: await Campaign.findOne(condition).select(select).lean() };
  } catch (error) {
    return { error };
  }
};

exports.updateOne = async (condition, updateData, options) => {
  try {
    return { result: await Campaign.findOneAndUpdate(condition, updateData, options) };
  } catch (error) {
    return { error };
  }
};
