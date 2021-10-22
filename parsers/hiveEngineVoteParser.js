const { tokensContract, commentContract } = require('utilities/hiveEngine');
const { Post } = require('models');
const { ENGINE_TOKENS } = require('constants/hiveEngine');
const moment = require('moment');
const _ = require('lodash');

exports.parseEngineVotes = async ({ votes, posts }) => {
  for (const TOKEN of ENGINE_TOKENS) {
    const {
      filteredPosts, filteredVotes, balances, votingPowers,
    } = await getBalancesAndFilterVotes({ TOKEN, posts, votes });
    if (_.isEmpty(balances)) continue;
    const { calcPosts, calcVotes } = await addRharesToPostsAndVotes({
      votes: filteredVotes,
      posts: filteredPosts,
      balances,
      votingPowers,
      tokenSymbol: TOKEN.SYMBOL,
    });
    await updatePostsRshares({ posts: calcPosts, tokenSymbol: TOKEN.SYMBOL });
    // #TODO update expertise map votes
  }
};

const getBalancesAndFilterVotes = async ({ TOKEN, posts, votes }) => {
  const filteredPosts = _.filter(
    posts,
    (el) => _.some(
      _.map(el.wobjects, 'author_permlink'),
      (item) => _.includes(TOKEN.TAGS, item),
    ),
  );
  const filteredVotes = _.filter(
    votes,
    (el) => _.some(
      filteredPosts,
      (item) => el.author === item.root_author && el.permlink === item.permlink,
    ),
  );
  const balances = await tokensContract.getTokenBalances({
    query: {
      symbol: TOKEN.SYMBOL, account: { $in: _.map(filteredVotes, 'voter') },
    },
  });
  // for some reason not work with operator $in
  const votingPowers = await commentContract.getVotingPower({
    query: {
      rewardPoolId: TOKEN.POOL_ID, $or: _.map(filteredVotes, (v) => ({ account: v.voter })),
    },
  });

  return {
    filteredPosts, filteredVotes, balances, votingPowers,
  };
};

const addRharesToPostsAndVotes = async ({
  votes, posts, balances, votingPowers, tokenSymbol,
}) => {
  for (const vote of votes) {
    if (!vote.type) continue;
    const balance = _.find(balances, (el) => el.account === vote.voter);
    const powerBalance = _.find(votingPowers, (el) => el.account === vote.voter);
    const post = _.find(posts, (p) => (p.author === vote.author || p.author === vote.guest_author) && p.permlink === vote.permlink);
    const createdOverAWeek = moment().diff(moment(_.get(post, 'createdAt')), 'day') > 7;
    if (!balance || !powerBalance || !post) continue;
    // if (createdOverAWeek) continue;
    const decreasedPercent = (((vote.weight / 100) * 2) / 100);
    const { stake, delegationsIn } = balance;
    const { votingPower } = powerBalance;
    const previousVotingPower = (100 * votingPower) / (100 - decreasedPercent);

    const finalRshares = parseFloat(stake) + parseFloat(delegationsIn);
    const power = (previousVotingPower * vote.weight) / 10000;

    const rshares = (power * finalRshares) / 10000;
    vote.rshares = rshares;
    post[`net_rshares_${tokenSymbol}`] = parseFloat(_.get(post, `net_rshares_${tokenSymbol}`, 0)) + rshares;
    const voteInPost = _.find(post.active_votes, (v) => v.voter === vote.voter);
    voteInPost
      ? voteInPost[`rshares${tokenSymbol}`] = rshares
      : post.active_votes.push({
        voter: vote.voter,
        percent: vote.weight,
        [`rshares${tokenSymbol}`]: rshares,
      });
  }
  return { calcPosts: posts, calcVotes: votes };
};

const updatePostsRshares = async ({ posts, tokenSymbol }) => {
  for (const post of posts) {
    await Post.updateOne(
      { author: post.author, permlink: post.permlink },
      {
        [`net_rshares_${tokenSymbol}`]: post[`net_rshares_${tokenSymbol}`],
        active_votes: post.active_votes,
      },
    );
  }
};

const updateUsersExpertise = async ( {}) => {

}
