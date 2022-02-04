const notificationsUtil = require('utilities/notificationsApi/notificationsUtil');
const { MAIN_OPS } = require('constants/parsersData');

exports.parse = async (operation) => {
  const vestingShares = operation.vesting_shares.split(' ')[0];
  await notificationsUtil.sendNotification({
    id: vestingShares > 0 ? MAIN_OPS.DELEGATE : MAIN_OPS.DELEGATE_VESTING_SHARES,
    data: {
      from: operation.delegator,
      to: operation.delegatee,
      amount: operation.vesting_shares,
      memo: '',
    },
  });
};
