const { hiveEngineValidator } = require('validator');
const { EngineAccountHistory } = require('models');
const moment = require('moment');
const customJsonHelper = require('utilities/helpers/customJsonHelper');

exports.create = async (data, operation, blockNum, transactionId, timestamp) => {
  const { payload, action } = data;
  const account = customJsonHelper.getTransactionAccount(operation);

  const { error, value } = hiveEngineValidator
    .createDepositSchema
    .validate({
      account,
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
