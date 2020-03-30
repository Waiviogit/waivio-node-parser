const notificationsUtil = require('utilities/notificationsApi/notificationsUtil');

exports.parse = async (operation) => {
  await notificationsUtil.custom(Object.assign(operation, { id: 'withdraw_vesting' }));
};

// module.export = { parse };
