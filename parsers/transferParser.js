const notificationsUtil = require('utilities/notificationsApi/notificationsUtil');
const { walletHelper } = require('utilities/helpers');

const parse = async (operation) => {
  await notificationsUtil.custom(Object.assign(operation, { id: 'transfer' }));
  const data = {
    type: 'transfer',
    account: operation.from,
    to: operation.to,
    amount: operation.amount,
    memo: operation.memo,
  };
  await walletHelper.addToWallet(data);
};

const parseVesting = async (operation) => {
  await notificationsUtil.custom(Object.assign(operation, { id: 'transfer_to_vesting' }));
  const data = {
    type: 'transfer_to_vesting',
    account: operation.from,
    to: operation.to,
    amount: operation.amount,
  };
  await walletHelper.addToWallet(data);
};

const parseFromSavings = async (operation) => {
  await notificationsUtil.custom(Object.assign(operation, { id: 'transfer_from_savings' }));
  const data = {
    type: 'transfer_from_savings',
    account: operation.from,
    to: operation.to,
    memo: operation.memo,
    request_id: operation.request_id,
  };
  await walletHelper.addToWallet(data);
};

const parseToSavings = async (operation) => {
  const data = {
    type: 'transfer_to_savings',
    account: operation.from,
    to: operation.to,
    memo: operation.memo,
  };
  await walletHelper.addToWallet(data);
};

module.exports = {
  parse, parseVesting, parseFromSavings, parseToSavings,
};
