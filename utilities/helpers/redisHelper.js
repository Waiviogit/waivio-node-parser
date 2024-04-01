const { redis } = require('utilities/redis');
const { commentParser } = require('parsers');
const postHelper = require('utilities/helpers/postHelper');
const config = require('config');

const expiredDataListener = async (chan, msg) => {
  const data = msg.split(':');
  if (config.parseOnlyVotes || !data[1]) return;
  const [author, permlink] = data[1].split('/');
  switch (data[0]) {
    case 'expire-hivePost':
      await postHelper.updateExpiredPost(author, permlink);
      break;
    case 'expire-notFoundPost':
      await postHelper.createPost({
        author, permlink, fromTTL: true, commentParser,
      });
      break;
    case 'expire-notFoundGuestComment':
      await postHelper.guestCommentFromTTL(author, permlink);
      break;
    default:
      break;
  }
};

exports.startRedisListener = () => {
  redis.expiredListener(expiredDataListener);
};
