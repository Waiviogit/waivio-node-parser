const notificationsUtil = require('utilities/notificationsApi/notificationsUtil');
const { sitesHelper, vipTicketsHelper, hiveEngineHelper } = require('utilities/helpers');
const { TRANSFER_ID, REFUND_ID } = require('constants/sitesData');
const { TICKETS_ACCOUNT } = require('constants/vipTicketsData');
const { MEMO_ID } = require('constants/parsersData');
const _ = require('lodash');

const parse = async (operation, blockNum) => {
  const memo = parseJson(operation.memo);
  if (_.get(memo, 'id')) {
    switch (memo.id) {
      case TRANSFER_ID:
      case REFUND_ID:
        await sitesHelper.parseSitePayments({ operation, type: memo.id, blockNum });
        break;
      case MEMO_ID.GUEST_TRANSFER:
        if (operation.to === TICKETS_ACCOUNT) {
          operation.from = memo.from;
          await vipTicketsHelper.processTicketPurchase({ ...operation, blockNum });
        }
        break;
      case MEMO_ID.HIVE_ENGINE:
        await hiveEngineHelper.parseEngineTransfer({ operation, memo });
        break;
    }
  }
  if (operation.to === TICKETS_ACCOUNT && _.get(memo, 'id') !== MEMO_ID.GUEST_TRANSFER) {
    await vipTicketsHelper.processTicketPurchase({ ...operation, blockNum });
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
