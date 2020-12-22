const { MutedUser } = require('database').models;

exports.muteUser = async ({ userName, mutedBy, updateData }) => {
  try {
    return MutedUser
      .updateOne({ userName, mutedBy }, updateData, { upsert: true, new: true }).lean();
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

exports.deleteMany = async (conditions) => {
  try {
    return {
      result: await MutedUser.deleteMany(conditions),
    };
  } catch (error) {
    return { error };
  }
};
