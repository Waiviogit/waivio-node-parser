const _ = require('lodash');
const moment = require('moment');
const { ObjectId } = require('mongoose').Types;
const { Post, CommentModel } = require('models');
const { postsUtil } = require('utilities/steemApi');
const { guestHelpers } = require('utilities/guestOperations');

exports.objectIdFromDateString = (dateStr) => {
  const timestamp = moment.utc(dateStr).format('x');
  let str = `${Math.floor(timestamp / 1000).toString(16)}${getRandomInt(10000, 99999)}00000000000`;
  let id;
  try {
    id = new ObjectId(str);
  } catch (e) {
    str = `${Math.floor(moment.utc().valueOf() / 1000).toString(16)}${getRandomInt(10000, 99999)}00000000000`;
    id = new ObjectId(str);
  }
  return id;
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
  if (!post || !post.author || (parseFloat(post.total_payout_value) === 0 && parseFloat(post.curator_payout_value) === 0)) {
    return;
  }
  const { result } = await Post.update(Object.assign(_.pick(post, ['permlink', 'total_payout_value', 'curator_payout_value', 'pending_payout_value']), { author }));
  if (result) console.log(`Post ${author}/${permlink} updated after 7 days`);
};

exports.createPost = async ({
  author, permlink, fromTTL = false, commentParser,
}) => {
  const { post, err } = await postsUtil.getPost(author, permlink);

  if (err || !post.author || !post.body) return console.error(`Post @${author}/${permlink} not found or was deleted!`);
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

exports.updatePostVotes = async (author, permlink) => {
  const { post: postInDb, error } = await Post.findOne({ root_author: author, permlink });
  if (!postInDb || error) return;
  const { post } = await postsUtil.getPost(author, permlink);
  if (!post) return;
  post.author = postInDb.author;
  post.active_votes = _.map(post.active_votes, (vote) => ({
    voter: vote.voter,
    weight: Math.round(vote.rshares * 1e-6),
    percent: vote.percent,
    rshares: vote.rshares,
  }));
  _.forEach(postInDb.active_votes, (dbVote) => {
    if (dbVote.voter.includes('_')) {
      post.active_votes.push(dbVote);
    }
  });

  await Post.update(post);
};

exports.guestCommentFromTTL = async (author, permlink) => {
  let metadata;
  const { post: comment, err } = await postsUtil.getPost(author, permlink);
  if (err || !comment) return;
  try {
    metadata = JSON.parse(comment.json_metadata);
  } catch (error) { }
  const guestInfo = await guestHelpers.getFromMetadataGuestInfo(
    { operation: { author }, metadata },
  );
  if (!guestInfo) return;
  delete comment.active_votes;
  const { error } = await CommentModel.createOrUpdate({ ...comment, guestInfo });
  if (error) return console.error(error);
  console.log(`Guest comment created: ${author}/${permlink}, guest name: ${guestInfo.userId}`);
};
