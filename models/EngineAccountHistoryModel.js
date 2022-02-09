const _ = require('lodash');
const EngineAccountHistoryModel = require('database').models.EngineAccountHistory;

const create = async (data) => {
  const EngineAccountHistory = new EngineAccountHistoryModel(data);
  try {
    return { engine_account_histories: await EngineAccountHistory.save() };
  } catch (error) {
    return { error };
  }
};

const insertMany = async (docs) => {
  try {
    return { engine_account_histories: await EngineAccountHistoryModel.insertMany(docs) };
  } catch (error) {
    return { error };
  }
};

module.exports = { create, insertMany };
