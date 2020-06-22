const notificationsUtil = require('utilities/notificationsApi/notificationsUtil');

exports.parse = async (operation) => {
  await notificationsUtil.custom(Object.assign(operation, { id: 'change_recovery_account' }));
};
