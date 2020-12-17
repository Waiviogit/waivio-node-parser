const { MutedUser } = require('database').models;

exports.muteUser = async ({ userName, updateData }) => {
  try {
    return MutedUser
      .findOneAndUpdate({ userName }, updateData, { upsert: true, new: true }).lean();
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
