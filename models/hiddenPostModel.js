const { HiddenPost } = require('database').models;

exports.update = async (data) => {
  try {
    return { result: await HiddenPost.findOneAndUpdate(data, data, { upsert: true, new: true }) };
  } catch (error) {
    return { error };
  }
};

exports.deleteOne = async ({ userName, postId }) => {
  try {
    return { result: await HiddenPost.deleteOne({ userName, postId }) };
  } catch (error) {
    return { error };
  }
};
