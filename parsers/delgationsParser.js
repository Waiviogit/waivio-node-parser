const notificationsUtil = require('utilities/notificationsApi/notificationsUtil');
const { MAIN_OPS } = require('constants/parsersData');
const { DelegationModel } = require('models');

exports.parse = async (operation, timestamp) => {
  await DelegationModel.createOne({
    ...operation, delegation_date: timestamp,
  });

  await notificationsUtil.sendNotification({
    id: MAIN_OPS.DELEGATE_VESTING_SHARES,
    data: {
      from: operation.delegator,
      to: operation.delegatee,
      amount: operation.vesting_shares,
    },
  });
};
