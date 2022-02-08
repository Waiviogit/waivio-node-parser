const notificationsUtil = require('utilities/notificationsApi/notificationsUtil');
const { MAIN_OPS } = require('constants/parsersData');

exports.parse = async (operation) => {
  await notificationsUtil.sendNotification({
    id: MAIN_OPS.DELEGATE_VESTING_SHARES,
    data: {
      from: operation.delegator,
      to: operation.delegatee,
      amount: operation.vesting_shares,
    },
  });
};
