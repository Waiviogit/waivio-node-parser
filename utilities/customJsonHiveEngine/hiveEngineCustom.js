const { ENGINE_CUSTOM_METHODS } = require('constants/hiveEngine');
const jsonHelper = require('utilities/helpers/jsonHelper');
const depositRecord = require('./depositRecord');

exports.parse = async (operation, blockNum, transaction_id) => {
  const data = jsonHelper.parseJson(operation.json);
  await (execute[data.action] || execute.default)(data.payload, operation, blockNum, transaction_id);
};

const execute = {
  [ENGINE_CUSTOM_METHODS.CREATE_DEPOSIT_RECORD]: depositRecord.create,
  default: () => {},
};
