const { REQUIRED_POSTING_AUTHS } = require('constants/parsersData');
const { hiveEngineValidator } = require('validator');
// const { engineDepositModel } = require('models');
const { EngineAccountHistory } = require('models');
const _ = require('lodash');

exports.create = async (payload, operation, blockNum) => {
  const userName = _.get(operation, REQUIRED_POSTING_AUTHS);

  const { error, value } = hiveEngineValidator
    .createDepositSchema
    .validate({ userName, blockNum, ...payload });

  if (error) return;

  const result = _.omit(value, ['blockNum', 'from_coin', 'to_coin']);
  result.refHiveBlockNumber = value.blockNum;
  result.symbolOut = value.from_coin;
  result.symbolIn = value.to_coin;

  await EngineAccountHistory.create(result);
};
