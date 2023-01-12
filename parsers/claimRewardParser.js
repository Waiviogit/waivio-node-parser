const notificationsUtil = require('utilities/notificationsApi/notificationsUtil');
const redisSetter = require('utilities/redis/redisSetter');
const { REDIS_KEYS } = require('constants/parsersData');

const parse = async (operation, transactionId) => {
  await notificationsUtil.custom(Object.assign(operation, { id: 'claimReward' }));

  await redisSetter.publishToChannel({
    channel: REDIS_KEYS.TX_ID_MAIN,
    msg: transactionId,
  });
};

module.exports = { parse };
