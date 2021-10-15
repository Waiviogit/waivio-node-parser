const { MutedUser } = require('database').models;

exports.find = async (condition, select = {}) => {
  try {
    return { mutedUsers: await MutedUser.find(condition, select).lean() };
  } catch (error) {
    return { error };
  }
};

exports.muteUser = async ({ mutedForApps, userName, mutedBy }) => {
  try {
    const result = await MutedUser.updateOne(
      { userName, mutedBy },
      { $addToSet: { mutedForApps: { $each: mutedForApps } } },
      { upsert: true },
    );
    return { result };
  } catch (error) {
    return { error };
  }
};

exports.updateHostList = async ({ mutedForApps, userName, mutedBy }) => {
  try {
    const result = await MutedUser.updateOne(
      { userName, mutedBy },
      { mutedForApps },
      { upsert: true },
    );
    return { result };
  } catch (error) {
    return { error };
  }
};

exports.deleteOne = async (condition) => {
  try {
    return {
      result: await MutedUser.deleteOne(condition),
    };
  } catch (error) {
    return { error };
  }
};

exports.findOne = async (condition, select = {}) => {
  try {
    return { result: await MutedUser.findOne(condition, select).lean() };
  } catch (error) {
    return { error };
  }
};
