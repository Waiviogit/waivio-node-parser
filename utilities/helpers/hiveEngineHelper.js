const _ = require('lodash');
const moment = require('moment');
const { getTransactionInfo } = require('utilities/hiveEngine/blockchain');
const { parseJson } = require('utilities/helpers/jsonHelper');
const { GuestWallet } = require('models');
const { transfer } = require('utilities/steemApi/broadcast');
const config = require('config');
const { setTimeout } = require('timers/promises');
const { redis, redisSetter } = require('../redis');

const WITHDRAW_LOCK_KEY = 'guest_withdraw_lock:';
const delWithdrawLock = async (account) => {
  await redisSetter.deleteKey({
    key: `${WITHDRAW_LOCK_KEY}${account}`,
    client: redis.expiredPostsClient,
  });
};

const createGuestWithdraw = async ({ operation, id }) => {
  const retryCount = 5;
  let transaction;

  for (let i = 0; i < retryCount; i++) {
    transaction = await getTransactionInfo(id);
    if (transaction) {
      break;
    } else {
      await setTimeout(1000);
    }
  }

  if (!transaction) {
    console.error(`ERROR cant fetch transaction info createGuestWithdraw ${id}`);
    return;
  }

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
  await delWithdrawLock(account);
  if (config.environment !== 'production') return;

  const amount = parseFloat(operation.amount);

  await transfer({
    from: config.guestHotAccount,
    to: address,
    activeKey: config.guestHotKey,
    memo: operation.memo,
    amount,
  });
};

exports.parseEngineTransfer = async ({ operation, memo }) => {
  if (operation.from !== 'honey-swap') return;
  if (operation.to !== config.guestHotAccount) return;
  const id = _.get(memo, 'json.contractPayload.id');
  if (!id) return;
  createGuestWithdraw({ operation, id });
};
