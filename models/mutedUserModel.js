const { MutedUser } = require('database').models;

exports.muteUser = async ({ userName, updateData }) => {
  try {
    return MutedUser
      .updateOne({ userName }, updateData, { upsert: true });
  } catch (error) {
    return { error };
  }
};

exports.findOne = async (condition, select = {}) => {
  try {
    return { mutedUser: await MutedUser.findOne(condition, select).lean() };
  } catch (error) {
    return { error };
  }
};
