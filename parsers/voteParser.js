const _ = require('lodash');
const { postsUtil, usersUtil } = require('utilities/steemApi');
const { User, Post } = require('models');
const { voteFieldHelper, votePostHelper, userHelper } = require('utilities/helpers');
const { commentRefGetter } = require('utilities/commentRefService');

const parse = async (votes) => {
  const votesOps = await votesFormat(votes);
  const posts = await getPosts(
    _.chain(votesOps)
      .filter((v) => !!v.type)
      .uniqWith((x, y) => x.author === y.author && x.permlink === y.permlink)
      .value(),
  );
  const postsWithVotes = await usersUtil.calculateVotePower({ votesOps, posts });
  await Promise.all(votesOps.map(async (voteOp) => {
    await parseVoteByType(voteOp, postsWithVotes);
  }));
  console.log(`Parsed votes: ${votesOps.length}`);
};

const parseVoteByType = async (voteOp, posts) => {
  if (voteOp.type === 'post_with_wobj') {
    await votePostWithObjects({
      author: voteOp.author, // author and permlink - identity of field
      permlink: voteOp.permlink,
      voter: voteOp.voter,
      percent: voteOp.weight, // in blockchain "weight" is "percent" of current vote
      wobjects: voteOp.wobjects,
      guest_author: voteOp.guest_author,
      posts,
    });
  } else if (voteOp.type === 'append_wobj') {
    await voteAppendObject({
      author: voteOp.author, // author and permlink - identity of field
      permlink: voteOp.permlink,
      voter: voteOp.voter,
      percent: voteOp.weight, // in blockchain "weight" is "percent" of current vote
      author_permlink: voteOp.root_wobj,
      // posts,
    });
  }
};

const voteAppendObject = async (data) => {
  // data include: author, permlink, percent, voter, author_permlink, posts
  // author and permlink - identity of field
  // author_permlink - identity of wobject
  let { weight, error } = await User.checkForObjectShares({
    name: data.voter,
    author_permlink: data.author_permlink,
  });
  // ignore users with zero or negative weight in wobject
  if (!weight || weight <= 0 || error) weight = 1;
  // voters weight in wobject
  data.weight = weight;

  let currentVote = _.chain(data.posts)
    .find({ author: data.author, permlink: data.permlink })
    .get('active_votes', [])
    .find({ voter: data.voter })
    .value();
  if (!currentVote) {
    const { vote, error: voteError } = await tryReserveVote(data.author, data.permlink, data.voter);
    if (voteError || !vote) {
      return console.error(voteError || `[voteAppendObject] Vote not found. {voter:${data.voter}, comment: ${data.author}/${data.permlink}`);
    }
    currentVote = vote;
  }

  data.rshares_weight = Math.round(Number(currentVote.rshares) * 1e-6);
  await voteFieldHelper.voteOnField(data);
};

// data include: posts, metadata, voter, percent, author, permlink, guest_author
const votePostWithObjects = async (data) => {
  data.post = data.posts.find((p) => p.author === data.author && p.permlink === data.permlink);
  if (!data.post) return;

  let metadata;
  try {
    if (_.get(data, 'post.json_metadata') !== '') {
      metadata = JSON.parse(data.post.json_metadata); // parse json_metadata from string to JSON
    }
  } catch (e) {
    console.error(e);
  }
  if (!metadata) return;
  if (!_.get(metadata, 'wobj.wobjects', []).length) {
    metadata.wobj = { wobjects: data.wobjects };
  }
  data.metadata = metadata;

  await votePostHelper.voteOnPost(data);
};

const getPosts = async (postsRefs) => {
  const posts = [];

  await Promise.all(postsRefs.map(async (postRef) => {
    const { post } = await Post.findOne({
      author: postRef.author,
      permlink: postRef.permlink,
    });

    if (post) {
      posts.push(post);
    }
  }));
  return posts;
}; // get list of posts from db

const votesFormat = async (votesOps) => {
  let accounts = [];
  votesOps = _
    .chain(votesOps)
    .orderBy(['weight'], ['desc'])
    .uniqWith((first, second) => first.author === second.author && first.permlink === second.permlink && first.voter === second.voter)
    .value();
  for (const voteOp of votesOps) {
    const response = await commentRefGetter.getCommentRef(`${voteOp.author}_${voteOp.permlink}`);
    accounts = _.concat(accounts, voteOp.author, voteOp.voter);
    if (_.get(response, 'type')) {
      voteOp.type = response.type;
      voteOp.root_wobj = response.root_wobj;
      voteOp.name = response.name;
      voteOp.guest_author = response.guest_author;
      let wobjects;
      if (response) {
        try {
          wobjects = JSON.parse(response.wobjects);
        } catch (e) {
          wobjects = [];
        }
      }
      voteOp.wobjects = wobjects;
    }
  }
  await userHelper.checkAndCreateByArray(accounts);
  return votesOps;
}; // format votes, add to each type of comment(post with wobj, append wobj etc.)

// Use this method when get vote from block but node still not perform this vote on database_api
const tryReserveVote = async (author, permlink, voter, times = 10) => {
  for (let i = 0; i < times; i++) {
    {
      const { votes = [], err } = await postsUtil.getVotes(author, permlink);
      if (err) return { error: err };
      const vote = votes.find((v) => v.voter === voter);
      if (vote) return { vote };
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }
  return { error: { message: `[tryReserveVote]Vote from ${voter} on post(or comment) @${author}/${permlink} not found!` } };
};

module.exports = { parse, votesFormat };
