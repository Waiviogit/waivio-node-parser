const postModeration = require('utilities/moderation/postModeration');
const { REDIS_KEY_VOTE_UPDATES } = require('constants/common');
const redisSetter = require('utilities/redis/redisSetter');
const userValidator = require('validator/userValidator');
const { Wobj, User, Post } = require('models');
const moment = require('moment');
const _ = require('lodash');

const voteOnPost = async (data) => {
  // calculated value, for using in wobject environment
  const currentVote = data.post.active_votes.find((vote) => vote.voter === data.voter);
  if (!currentVote) return;

  const weight = Math.round(currentVote.rshares * 1e-6);

  if (await userValidator.validateUserOnBlacklist([data.voter, data.post.author, data.guest_author])) {
    await unvoteOnPost(data);
    if (data.percent < 0) {
      await downVoteOnPost(data, weight); // case for down-vote
    } else if (data.percent > 0) {
      await upVoteOnPost(data, weight); // case for up-vote
    }
  }
  await updateVotesOnPost(data);
};

// method also using as undo previous vote before up- or down-vote
const unvoteOnPost = async (data) => {
  const { post, error } = await Post.findOne({
    author: _.get(data, 'guest_author', data.post.author),
    permlink: data.post.permlink,
  });
  if (!post || error) return {};

  const existingVote = post.active_votes.find((vote) => vote.voter === data.voter);
  if (existingVote) {
    // if un-vote after down-vote, need increase only author weight in wobjects
    if (existingVote.weight < 0) {
      await downVoteOnPost(data, -existingVote.weight);
    } else if (existingVote.weight > 0) {
      // if un-vote after up-vote, need decrease author, voter and wobject weights
      await upVoteOnPost(data, -existingVote.weight);
    }
  }
};

const downVoteOnPost = async (data, weight) => {
  if (_.isArray(_.get(data, 'metadata.wobj.wobjects'))) {
    for (const wObject of _.get(data, 'metadata.wobj.wobjects', [])) {
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
    wobjects: _.get(data, 'metadata.wobj.wobjects'),
  });
};

const upVoteOnPost = async (data, weight) => {
  if (_.isArray(_.get(data, 'metadata.wobj.wobjects'))) {
    for (const wObject of _.get(data, 'metadata.wobj.wobjects', [])) {
      // calculate vote weight for each wobject in post
      const voteWeight = Number((weight * (wObject.percent / 100)).toFixed(3));

      await Wobj.increaseWobjectWeight({
        author_permlink: wObject.author_permlink, // increase wobject weight
        weight: voteWeight,
      });
      await User.increaseWobjectWeight({
        name: _.get(data, 'guest_author', data.post.author),
        author_permlink: wObject.author_permlink, // increase author weight in wobject
        weight: Number((voteWeight * 0.75).toFixed(3)),
      });
      await User.increaseWobjectWeight({
        name: data.voter,
        author_permlink: wObject.author_permlink,
        weight: Number((voteWeight * 0.25).toFixed(3)),
      });
    }
  }
};

const updateVotesOnPost = async (data) => {
  data.post.active_votes = _.map(data.post.active_votes, (vote) => ({
    voter: vote.voter,
    weight: Math.round(vote.rshares * 1e-6),
    percent: vote.percent,
    rshares: vote.rshares,
  }));

  data.post.author = _.get(data, 'guest_author', data.post.author);
  await Post.update(data.post); // update post info in DB
  await redisSetter.sadd(
    `${REDIS_KEY_VOTE_UPDATES}:${moment.utc().startOf('hour').format()}`,
    `${data.author}/${data.permlink}`,
  );
};

module.exports = { voteOnPost };
