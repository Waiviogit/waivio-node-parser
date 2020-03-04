const notificationsUtil = require('utilities/notificationsApi/notificationsUtil');

const parse = async (operation) => {
  await notificationsUtil.witness(operation);
};

module.exports = { parse };
