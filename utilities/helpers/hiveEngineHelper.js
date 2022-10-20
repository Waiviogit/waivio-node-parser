const _ = require('lodash');
const moment = require('moment');
const { getTransactionInfo } = require('utilities/hiveEngine/blockchain');
const { parseJson } = require('utilities/helpers/jsonHelper');
const { GuestWallet } = require('models');
const { transfer } = require('utilities/steemApi/broadcast');

exports.parseEngineTransfer = async ({ operation, memo }) => {
  if (operation.from !== 'honey-swap') return;
  if (operation.to !== process.env.GUEST_HOT_ACC) return;
  const id = _.get(memo, 'json.contractPayload.id');
  if (!id) return;
  const transaction = await getTransactionInfo(id);
  if (!transaction) return;
  const payload = parseJson(transaction.payload, null);
  if (!payload) return;
  const {
    inputSymbol,
    inputQuantity,
    address,
    account,
  } = payload;
  if (!address || !inputSymbol || !inputQuantity || !account) return;

  await GuestWallet.create({
    refHiveBlockNumber: transaction.refHiveBlockNumber,
    blockNumber: transaction.blockNumber,
    account,
    transactionId: transaction.transactionId,
    operation: 'guest_withdraw',
    timestamp: moment().unix(),
    quantity: inputQuantity,
    symbol: inputSymbol,
    symbolOut: 'HIVE',
    to: address,
    from: account,
  });
  if (process.env.NODE_ENV !== 'production') return;

  const amount = parseFloat(operation.amount);

  await transfer({
    from: process.env.GUEST_HOT_ACC,
    to: address,
    activeKey: process.env.GUEST_HOT_KEY,
    memo: operation.memo,
    amount,
  });
};
