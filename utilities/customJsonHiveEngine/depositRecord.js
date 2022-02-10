const { REQUIRED_POSTING_AUTHS } = require('constants/parsersData');
const { hiveEngineValidator } = require('validator');
const { EngineAccountHistory } = require('models');
const _ = require('lodash');

exports.create = async (payload, operation, blockNum, transactionId) => {
  const userName = _.get(operation, REQUIRED_POSTING_AUTHS);

  const { error, value } = hiveEngineValidator
    .createDepositSchema
    .validate({
      userName, blockNum, ...payload, operation: operation.id, transactionId,
    });

  if (error) return;

  const result = _.omit(value, ['blockNum', 'from_coin', 'to_coin', 'account', 'userName']);
  result.refHiveBlockNumber = value.blockNum;
  result.symbolOut = value.from_coin;
  result.account = value.userName;
  result.symbolIn = value.to_coin;
  if (value.account) {
    result.depositAccount = value.account;
  }
  await EngineAccountHistory.create(result);
};
