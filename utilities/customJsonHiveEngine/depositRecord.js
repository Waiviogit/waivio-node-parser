const { REQUIRED_POSTING_AUTHS } = require('constants/parsersData');
const { hiveEngineValidator } = require('validator');
const { EngineAccountHistory } = require('models');
const _ = require('lodash');

exports.create = async (payload, operation, blockNum, transactionId) => {
  const userName = _.get(operation, REQUIRED_POSTING_AUTHS);

  const { error, value } = hiveEngineValidator
    .createDepositSchema
    .validate({
      account: userName,
      destination: payload.destination,
      pair: payload.pair,
      ex_rate: payload.ex_rate,
      memo: payload.memo,
      symbolIn: payload.from_coin,
      symbolOut: payload.to_coin,
      refHiveBlockNumber: blockNum,
      depositAccount: payload.account,
      operation: operation.id,
      transactionId,
      address: payload.address,
    });

  if (error) return;

  await EngineAccountHistory.create(value);
};
