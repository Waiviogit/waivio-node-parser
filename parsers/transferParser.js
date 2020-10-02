const _ = require('lodash');
const notificationsUtil = require('utilities/notificationsApi/notificationsUtil');
const { TRANSFER_ID, REFUND_ID } = require('constants/sitesData');
const { sitesHelper } = require('utilities/helpers');

const parse = async (operation, blockNum) => {
  const memo = parseJson(operation.memo);
  if (_.get(memo, 'id')) {
    switch (memo.id) {
      case TRANSFER_ID:
      case REFUND_ID:
        await sitesHelper.parseSitePayments({ operation, type: memo.id, blockNum });
        break;
    }
  }
  await notificationsUtil.custom(Object.assign(operation, { id: 'transfer' }));
};

const parseVesting = async (operation) => {
  await notificationsUtil.custom(Object.assign(operation, { id: 'transfer_to_vesting' }));
};

const parseFromSavings = async (operation) => {
  await notificationsUtil.custom(Object.assign(operation, { id: 'transfer_from_savings' }));
};

const parseJson = (json) => {
  try {
    return JSON.parse(json);
  } catch (error) {
    console.error(error.message);
    return null;
  }
};


module.exports = {
  parse, parseVesting, parseFromSavings,
};
