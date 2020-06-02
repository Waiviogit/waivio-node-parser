const { redis } = require('utilities/redis');
const postHelper = require('utilities/helpers/postHelper');
const postWithObjectsParser = require('parsers/postWithObjectParser');


const expiredDataListener = async (chan, msg) => {
  const data = msg.split(':');
  const author = data[1].split('/')[0];
  const permlink = data[1].split('/')[1];
  switch (data[0]) {
    case 'expire-hivePost':
      await postHelper.updateExpiredPost(author, permlink);
      break;
    case 'expire-notFoundPost':
      await postWithObjectsParser.createOrUpdatePost({ author, permlink }, null, true);
      break;
    default:
      break;
  }
};

exports.startRedisListener = () => {
  redis.expiredListener(expiredDataListener);
};
