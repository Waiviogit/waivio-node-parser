const { SpamUser } = require('database').models;

const updateOne = async (data) => {
  try {
    const result = await SpamUser.findOneAndUpdate(
      { user: data.user, type: data.type },
      data,
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    return { result: !!result };
  } catch (error) {
    return { error };
  }
};

const find = async (condition, select = {}) => {
  try {
    return { result: await SpamUser.find(condition, select).lean() };
  } catch (error) {
    return { error };
  }
};

const bulkWrite = async (ops) => {
  try {
    return { result: await SpamUser.bulkWrite(ops) };
  } catch (error) {
    return { error };
  }
};

module.exports = {
  updateOne,
  find,
  bulkWrite,
};
