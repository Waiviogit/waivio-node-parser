const postModeration = require('utilities/moderation/postModeration');
const { REDIS_KEY_VOTE_UPDATES, VOTE_FIELDS } = require('constants/common');
const redisSetter = require('utilities/redis/redisSetter');
const userValidator = require('validator/userValidator');
const { Wobj, User, Post } = require('models');
const moment = require('moment');
const _ = require('lodash');
const { getUSDFromRshares } = require('./rewardHelper');

const voteOnPost = async (data) => {
  // calculated value, for using in wobject environment
  const currentVote = data.post.active_votes.find((vote) => vote.voter === data.voter);
  if (!currentVote) return;

  const weight = await getUSDFromRshares(currentVote.rshares);

  const validUser = await userValidator
    .validateUserOnBlacklist([data.voter, data.post.author, data.guest_author]);

  if (!validUser) return;

  await unvoteOnPost(data);
  if (data.percent < 0) {
    await downVoteOnPost(data, weight); // case for down-vote
  } else if (data.percent > 0) {
    await upVoteOnPost(data, weight); // case for up-vote
  }
};

// method also using as undo previous vote before up- or down-vote
const unvoteOnPost = async (data) => {
  const { post, error } = await Post.findOne({
    author: _.get(data, 'guest_author', data.post.author),
    permlink: data.post.permlink,
  });
  if (!post || error) return {};

  const existingVote = post.active_votes.find((vote) => vote.voter === data.voter);
  if (!existingVote) return;

  // if un-vote after down-vote, need increase only author weight in wobjects
  if (existingVote.weight < 0) {
    await downVoteOnPost(data, -existingVote.weight);
  } else if (existingVote.weight > 0) {
    // if un-vote after up-vote, need decrease author, voter and wobject weights
    await upVoteOnPost(data, -existingVote.weight);
  }
};

const downVoteOnPost = async (data, weight) => {
  if (_.isArray(_.get(data, 'post.wobjects'))) {
    for (const wObject of _.get(data, 'post.wobjects', [])) {
      // calculate vote weight for each wobject in post
      const voteWeight = Number(weight * (wObject.percent / 100).toFixed(3));
      await User.increaseWobjectWeight({
        name: _.get(data, 'guest_author', data.post.author),
        author_permlink: wObject.author_permlink, // decrease author weight in wobject
        weight: voteWeight,
      });
    }
  }
  // check for blog(ignore) post from admin or moderator
  await postModeration.checkDownVote({
    voter: data.voter,
    author: data.post.author,
    guestAuthor: data.guest_author,
    permlink: data.post.permlink,
  });
};

const upVoteOnPost = async (data, weight) => {
  if (_.isArray(_.get(data, 'post.wobjects'))) {
    for (const wObject of _.get(data, 'post.wobjects', [])) {
      // calculate vote weight for each wobject in post
      const voteWeight = Number((weight * (wObject.percent / 100)).toFixed(8));
      if (voteWeight === 0) continue;

      await Wobj.increaseWobjectWeight({
        author_permlink: wObject.author_permlink, // increase wobject weight
        weight: voteWeight,
      });

      await User.increaseWobjectWeight({
        name: _.get(data, 'guest_author', data.post.author),
        author_permlink: wObject.author_permlink, // increase author weight in wobject
        weight: Number((voteWeight * 0.5).toFixed(8)),
      });
    }
  }
};

const updateVotesOnPost = async (data) => {
  data.post.active_votes = _.map(data.post.active_votes, (vote) => ({
    ..._.pick(vote, VOTE_FIELDS),
    weight: Math.round(vote.rshares * 1e-6),
  }));

  data.post.author = _.get(data, 'guest_author', data.post.author);
  await Post.update(data.post); // update post info in DB
  await redisSetter.sadd(
    `${REDIS_KEY_VOTE_UPDATES}:${moment.utc().startOf('hour').format()}`,
    `${data.post.author}/${data.post.permlink}`,
  );
};

module.exports = { voteOnPost, updateVotesOnPost };
