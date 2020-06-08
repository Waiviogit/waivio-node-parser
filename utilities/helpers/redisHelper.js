const { redis } = require('utilities/redis');
const postHelper = require('utilities/helpers/postHelper');
const { postsUtil } = require('utilities/steemApi');
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
      const { post } = await postsUtil.getPost(author, permlink);
      const metadata = parseMetadata(post);
      await postWithObjectsParser.parse({ author, permlink }, metadata, post, true);
      break;
    default:
      break;
  }
};

const parseMetadata = (operation) => {
  try {
    if (operation.json_metadata !== '') {
      return JSON.parse(operation.json_metadata); // parse json_metadata from string to JSON
    }
  } catch (e) {
    console.error(e);
    return '';
  }
};

exports.startRedisListener = () => {
  redis.expiredListener(expiredDataListener);
};
