const { REQUIRED_POSTING_AUTHS } = require('constants/parsersData');
const { hiveEngineValidator } = require('validator');
const { EngineAccountHistory } = require('models');
const moment = require('moment');
const _ = require('lodash');

exports.create = async (data, operation, blockNum, transactionId, timestamp) => {
  const { payload, action } = data;
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
      operation: action,
      transactionId,
      ...(payload.account && { depositAccount: payload.account }),
      ...(payload.memo && { memo: typeof payload.memo === 'string' ? payload.memo : JSON.stringify(payload.memo) }),
      ...(payload.address && { address: payload.address }),
      timestamp: moment(timestamp).unix(),
    });

  if (error) return;

  await EngineAccountHistory.create(value);
};
