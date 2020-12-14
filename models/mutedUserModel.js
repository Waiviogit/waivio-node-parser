const { MutedUser } = require('database').models;

exports.muteUser = async ({ userName, updateData }) => {
  try {
    return MutedUser
      .updateOne({ userName }, updateData, { upsert: true });
  } catch (error) {
    return { error };
  }
};
