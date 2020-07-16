const moment = require('moment');
const _ = require('lodash');
const { ObjectId } = require('mongoose').Types;
const { postsUtil } = require('utilities/steemApi');
const { Post } = require('models');

exports.objectIdFromDateString = (dateStr) => {
  const timestamp = moment.utc(dateStr).format('x');
  const str = `${Math.floor(timestamp / 1000).toString(16)}${getRandomInt(10000, 99999)}00000000000`;
  return new ObjectId(str);
};

const getRandomInt = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};


exports.updateExpiredPost = async (author, permlink) => {
  const { post: dbPost } = await Post.findOne({ author, permlink });
  if (!dbPost || !dbPost.author) return;

  const { post } = await postsUtil.getPost(dbPost.root_author, permlink);
  if (!post || !post.author || parseFloat(post.total_payout_value) === 0) return;
  const { result } = await Post.update(Object.assign(_.pick(post, ['permlink', 'total_payout_value', 'curator_payout_value', 'pending_payout_value']), { author }));
  if (result) console.log(`Post ${author}/${permlink} updated after 7 days`);
};

exports.createPost = async ({
  author, permlink, fromTTL = false, commentParser,
}) => {
  const { post, err } = await postsUtil.getPost(author, permlink);
  if (err) return console.error(err.message);
  if (!post.author || !post.body) return console.log(`Post @${author}/${permlink} not found or was deleted!`);
  const metadata = this.parseMetadata(post.json_metadata);
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
    fromTTL,
  });
};

exports.parseMetadata = (metadata) => {
  try {
    if (metadata !== '') {
      return JSON.parse(metadata);
    }
  } catch (e) {
    console.error(e.message);
    return '';
  }
};
