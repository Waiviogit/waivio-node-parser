const { EngineDeposit } = require('database').models;

exports.create = async (record) => {
  try {
    const newRecord = new EngineDeposit(record);
    await newRecord.save();
    return { result: true };
  } catch (error) {
    return { error };
  }
};
