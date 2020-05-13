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


exports.updateExpiredPostPost = async (postData) => {
  const author = postData.split('/')[0];
  const permlink = postData.split('/')[1];

  const { post: dbPost } = await Post.findOne({ author, permlink });
  if (!dbPost || !dbPost.author) return;

  const { post } = await postsUtil.getPost(dbPost.root_author, permlink);
  if (!post || !post.author || parseFloat(post.total_payout_value) === 0) return;
  const { result } = await Post.update(_.pick(post, ['author', 'permlink', 'total_payout_value', 'curator_payout_value']));
  if (result) console.log(`Post ${postData} updated after 7 days`);
};
