const notificationsUtil = require('utilities/notificationsApi/notificationsUtil');

const parse = async (operation) => {
  await notificationsUtil.custom(Object.assign(operation, { id: 'claimReward' }));
};

module.exports = { parse };
