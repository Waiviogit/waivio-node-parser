const _ = require('lodash');
const EngineAccountHistoryModel = require('database').models.EngineAccountHistory;

const create = async (data) => {
  const EngineAccountHistory = new EngineAccountHistoryModel(data);
  try {
    return { result: await EngineAccountHistory.save() };
  } catch (error) {
    return { error };
  }
};

module.exports = { create };
