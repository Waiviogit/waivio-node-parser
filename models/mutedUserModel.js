const _ = require('lodash');
const { MutedUser } = require('database').models;

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

exports.muteUsers = async ({ users, updateData, mutedBy }) => {
  const updateArr = _.map(users, (el) => (
    {
      updateOne: {
        filter: { userName: el, mutedBy },
        update: updateData,
        upsert: true,
      },
    }
  ));
  try {
    return MutedUser.bulkWrite(updateArr);
  } catch (error) {
    return { error };
  }
};
