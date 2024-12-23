const postModeration = require('utilities/moderation/postModeration');
const { REDIS_KEY_VOTE_UPDATES } = require('constants/common');
const redisSetter = require('utilities/redis/redisSetter');
const userValidator = require('validator/userValidator');
const { Wobj, User, Post } = require('models');
const _ = require('lodash');
const moment = require('moment');
const { getUSDFromRshares } = require('./rewardHelper');

const voteOnPost = async (data) => {
  // calculated value, for using in wobject environment
  const currentVote = data.post.active_votes.find((vote) => vote.voter === data.voter);
  if (!currentVote) return;

  const validUser = await userValidator
    .validateUserOnBlacklist([data.voter, data.post.author, data.guest_author]);

  if (!validUser) return;

  const weight = await getUSDFromRshares(currentVote.rshares);

  await unvoteOnPost(data);
  if (data.percent < 0) {
    await downVoteOnPost(data); // case for down-vote
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
  // todo remove
  if (moment(post.createdAt).isBefore('2024-12-24T00:00')) return;

  const existingVote = post.active_votes.find((vote) => vote.voter === data.voter);
  if (!existingVote) return;

  // if un-vote after down-vote, need increase only author weight in wobjects
  if (existingVote.weight < 0) {
    await downVoteOnPost(data);
  } else if (existingVote.weight > 0) {
    // if un-vote after up-vote, need decrease author, voter and wobject weights
    await upVoteOnPost(data, -existingVote.weight);
  }
};

const downVoteOnPost = async (data) => {
  // check for blog(ignore) post from admin or moderator
  await postModeration.checkDownVote({
    voter: data.voter,
    author: data.post.author,
    guestAuthor: data.guest_author,
    permlink: data.post.permlink,
  });
};

const upVoteOnPost = async (data, weight) => {
  if (weight === 0) return;
  if (_.isArray(_.get(data, 'post.wobjects'))) {
    for (const wObject of _.get(data, 'post.wobjects', [])) {
      // calculate vote weight for each wobject in post
      const voteWeight = Number((weight * (wObject.percent / 100)).toFixed(8));
      if (voteWeight === 0) continue;
      const expertiseUsd = Number((voteWeight * 0.5).toFixed(8));

      await Wobj.increaseWobjectWeight({
        author_permlink: wObject.author_permlink, // increase wobject weight
        weight: expertiseUsd,
      });

      await User.increaseWobjectWeight({
        name: _.get(data, 'guest_author', data.post.author),
        author_permlink: wObject.author_permlink, // increase author weight in wobject
        weight: expertiseUsd,
      });
    }
  }
};

const updateVotesOnPost = async (data) => {
  data.post.author = _.get(data, 'guest_author', data.post.author);
  await Post.update(data.post); // update post info in DB
  await redisSetter.sadd(
    `${REDIS_KEY_VOTE_UPDATES}:${moment.utc().startOf('hour').format()}`,
    `${data.post.author}/${data.post.permlink}`,
  );
};

module.exports = { voteOnPost, updateVotesOnPost };
