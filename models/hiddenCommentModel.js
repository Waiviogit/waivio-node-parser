const { HiddenComment } = require('database').models;

exports.update = async (data) => {
  try {
    return { result: await HiddenComment.findOneAndUpdate(data, data, { upsert: true, new: true }) };
  } catch (error) {
    return { error };
  }
};

exports.deleteOne = async ({ userName, author, permlink }) => {
  try {
    return { result: await HiddenComment.deleteOne({ userName, author, permlink }) };
  } catch (error) {
    return { error };
  }
};
