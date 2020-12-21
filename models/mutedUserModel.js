const { MutedUser } = require('database').models;

exports.muteUser = async ({ userName, mutedBy, updateData }) => {
  try {
    return MutedUser
      .findOneAndUpdate({ userName, mutedBy }, updateData, { upsert: true, new: true }).lean();
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

exports.find = async (condition, select = {}) => {
  try {
    return { mutedUsers: await MutedUser.find(condition, select).lean() };
  } catch (error) {
    return { error };
  }
};
