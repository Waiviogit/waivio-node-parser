const { redis } = require('utilities/redis');
const postHelper = require('utilities/helpers/postHelper');


const expiredDataListener = async (chan, msg) => {
  const data = msg.split(':');

  switch (data[0]) {
    case 'expire-hivePost':
      await postHelper.updateExpiredPostPost(data[1]);
      break;
    default:
      break;
  }
};

exports.startRedisListener = () => {
  redis.expiredListener(expiredDataListener);
};
