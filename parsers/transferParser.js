const notificationsUtil = require('utilities/notificationsApi/notificationsUtil');
const { walletHelper } = require('utilities/helpers');

const parse = async (operation) => {
  await notificationsUtil.custom(Object.assign(operation, { id: 'transfer' }));
};

const parseVesting = async (operation) => {
  await notificationsUtil.custom(Object.assign(operation, { id: 'transfer_to_vesting' }));
  const data = {

  };
};

const parseFromSavings = async (operation) => {
  await notificationsUtil.custom(Object.assign(operation, { id: 'transfer_from_savings' }));
};

const parseToSavings = async (operation) => {

};

module.exports = {
  parse, parseVesting, parseFromSavings, parseToSavings,
};
