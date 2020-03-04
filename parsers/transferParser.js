const notificationsUtil = require('utilities/notificationsApi/notificationsUtil');

const parse = async (operation) => {
  await notificationsUtil.transfer(operation);
};

module.exports = { parse };
