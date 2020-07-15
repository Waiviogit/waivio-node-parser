const { redis } = require('utilities/redis');
const postHelper = require('utilities/helpers/postHelper');
const { postsUtil } = require('utilities/steemApi');
const commentParser = require('parsers/commentParser');


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
        const { post, err } = await postsUtil.getPost(author, permlink);
        if (err) return console.error(err.message);
        if (!post.author || !post.body) return console.log(`Post @${author}/${permlink} not found or was deleted!`);
        const metadata = parseMetadata(post);
        if (!metadata) return;
        await commentParser.postSwitcher({
          operation: {
            author,
            permlink,
            json_metadata: post.json_metadata,
            body: post.body,
            title: post.title,
            parent_author: post.parent_author,
            parent_permlink: post.parent_permlink,
          },
          metadata,
          post,
          fromTTL: true,
        });
      }
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
