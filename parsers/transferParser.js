const notificationsUtil = require('utilities/notificationsApi/notificationsUtil');
const { walletHelper } = require('utilities/helpers');

const parse = async (operation, trxId) => {
  await notificationsUtil.custom(Object.assign(operation, { id: 'transfer' }));
  const data = {
    type: 'transfer',
    account: operation.from,
    to: operation.to,
    amount: operation.amount,
    memo: operation.memo,
    trx_id: trxId,
    timestamp: Math.round(new Date() / 1000),
  };
  await walletHelper.addToWallet(data);
};

const parseVesting = async (operation, trxId) => {
  await notificationsUtil.custom(Object.assign(operation, { id: 'transfer_to_vesting' }));
  const data = {
    type: 'transfer_to_vesting',
    account: operation.from,
    to: operation.to,
    amount: operation.amount,
    trx_id: trxId,
    timestamp: Math.round(new Date() / 1000),
  };
  await walletHelper.addToWallet(data);
};

const parseFromSavings = async (operation, trxId) => {
  await notificationsUtil.custom(Object.assign(operation, { id: 'transfer_from_savings' }));
  const data = {
    type: 'transfer_from_savings',
    account: operation.from,
    to: operation.to,
    memo: operation.memo,
    request_id: operation.request_id,
    trx_id: trxId,
    timestamp: Math.round(new Date() / 1000),
  };
  await walletHelper.addToWallet(data);
};

const parseToSavings = async (operation, trxId) => {
  const data = {
    type: 'transfer_to_savings',
    account: operation.from,
    to: operation.to,
    memo: operation.memo,
    trx_id: trxId,
    timestamp: Math.round(new Date() / 1000),
  };
  await walletHelper.addToWallet(data);
};

module.exports = {
  parse, parseVesting, parseFromSavings, parseToSavings,
};
