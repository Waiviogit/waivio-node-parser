const { redis } = require('utilities/redis');
const postHelper = require('utilities/helpers/postHelper');
const { commentParser } = require('parsers');


const expiredDataListener = async (chan, msg) => {
  const data = msg.split(':');
  const author = data[1].split('/')[0];
  const permlink = data[1].split('/')[1];
  switch (data[0]) {
    case 'expire-hivePost':
      if (!process.env.PARSE_ONLY_VOTES) {
        await postHelper.updateExpiredPost(author, permlink);
      }
      break;
    case 'expire-notFoundPost':
      if (!process.env.PARSE_ONLY_VOTES) {
        await postHelper.createPost({
          author, permlink, fromTTL: true, commentParser,
        });
      }
      break;
    default:
      break;
  }
};

exports.startRedisListener = () => {
  redis.expiredListener(expiredDataListener);
};
