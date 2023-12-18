const { hivedClient, hiveMindClient } = require('utilities/steemApi/createClient');
const { getHashAll } = require('utilities/redis/redisGetter');
const { lastBlockClient } = require('utilities/redis/redis');
const { VOTE_TYPES, REDIS_KEYS } = require('constants/parsersData');
const moment = require('moment');
const _ = require('lodash');
const redisSetter = require('utilities/redis/redisSetter');
const redisGetter = require('utilities/redis/redisGetter');
const { socketHiveClient } = require('../socketClient/hiveSocket');

const getUser = async (accountName) => {
  try {
    // const result = await socketHiveClient.getAccounts([accountName]);
    // if (!_.get(result, 'error')) {
    //   return { user: result[0] };
    // }
    const [user] = await hivedClient.database.getAccounts([accountName]);
    return { user };
  } catch (error) {
    return { error };
  }
};

const getUsers = async (accountNames) => {
  try {
    // const result = await socketHiveClient.getAccounts(accountNames);
    // if (!_.get(result, 'error')) {
    //   return { users: result };
    // }
    const users = await hivedClient.database.getAccounts(accountNames);
    return { users };
  } catch (error) {
    return { error };
  }
};

const parseToFloat = (balance) => parseFloat(balance.match(/.\d*.\d*/)[0]);

const getCurrentPriceInfo = async () => {
  try {
    const sbdMedian = await hivedClient.database.call('get_current_median_history_price', []);
    const rewardFund = await hivedClient.database.call('get_reward_fund', ['post']);
    return {
      currentPrice: parseToFloat(sbdMedian.base) / parseToFloat(sbdMedian.quote),
      rewardFund,
    };
  } catch (error) {
    return { error };
  }
};

const getDynamicGlobalProperties = async () => {
  try {
    return { result: await hivedClient.database.call('get_dynamic_global_properties') };
  } catch (error) {
    return { error };
  }
};

const getProcessedVotes = async (votes) => {
  const votedPosts = await redisGetter
    .zrevrange({ key: REDIS_KEYS.PROCESSED_LIKES, start: 0, end: -1 });
  return _.filter(votes, (e) => _.some(_.map(votedPosts, (el) => ({
    voter: el.split(':')[0],
    author: el.split(':')[1],
    permlink: el.split(':')[2],
  })), (l) => l.voter === e.voter && l.author === e.author && l.permlink === e.permlink));
};

const calculateVotePower = async ({ votesOps, posts }) => {
  const priceInfo = await getHashAll(REDIS_KEYS.CURRENT_PRICE_INFO, lastBlockClient);

  const votesProcessedOnApi = await getProcessedVotes(votesOps);

  for (const vote of votesOps) {
    if (!vote.type) continue;

    const post = _.find(posts, (p) => (p.author === vote.author || p.author === vote.guest_author)
      && p.permlink === vote.permlink);

    const rShares = +vote.rshares;
    const createdOverAWeek = moment().diff(moment(_.get(post, 'createdAt')), 'day') > 7;
    if (!post || createdOverAWeek) {
      vote.rshares = rShares || 1;
      continue;
    }
    const voteInPost = _.find(post.active_votes, (v) => v.voter === vote.voter);
    vote.rshares = rShares;
    const processed = _.find(votesProcessedOnApi, (el) => _.isEqual(vote, el));
    if (processed) {
      await redisSetter.zrem({
        key: REDIS_KEYS.PROCESSED_LIKES,
        member: `${vote.voter}:${vote.author}:${vote.permlink}`,
      });
      continue;
    }
    const voteInPostRshares = _.get(voteInPost, 'rshares');
    voteInPost
      ? Object.assign(
        voteInPost,
        handleVoteInPost({ vote, voteInPost, rshares: rShares }),
      )
      : post.active_votes.push({
        voter: vote.voter,
        percent: vote.weight,
        rshares: Math.round(rShares),
        weight: Math.round(rShares * 1e-6),
      });
    // such vote will not affect total payout
    if (!rShares && !voteInPost) continue;
    // net_rshares sum of all post active_votes rshares negative and positive
    const tRShares = getPostNetRshares({
      netRshares: parseFloat(_.get(post, 'net_rshares', 0)),
      weight: vote.weight,
      voteInPostRshares,
      rshares: rShares,
    });

    const rewards = parseFloat(priceInfo.reward_balance) / parseFloat(priceInfo.recent_claims);
    // *price - to calculate in HBD
    const postValue = tRShares * rewards * parseFloat(priceInfo.price);

    post.net_rshares = Math.round(tRShares);
    post.pending_payout_value = postValue < 0 ? '0.000 HBD' : `${postValue.toFixed(3)} HBD`;
  }
  return posts;
};

const getPostNetRshares = ({
  netRshares, weight, rshares, voteInPostRshares,
}) => {
  if (voteInPostRshares && weight === 0) {
    return netRshares - voteInPostRshares;
  }
  if (voteInPostRshares) {
    return netRshares - voteInPostRshares + rshares;
  }
  return netRshares + rshares;
};

const handleVoteInPost = ({ vote, voteInPost, rshares }) => {
  if (vote.weight === 0) {
    return {
      ...voteInPost,
      percent: 0,
      rshares: 0,
      weight: 0,
    };
  }
  return {
    ...voteInPost,
    rshares: Math.round(rshares),
    weight: Math.round(rshares * 1e-6),
    percent: vote.weight,
  };
};

const getMutedList = async (name) => {
  try {
    const result = await hiveMindClient.call('bridge', 'get_follow_list', {
      observer: name,
      follow_type: 'muted',
    });
    return { mutedList: _.map(result, 'name') };
  } catch (e) {
    return { mutedList: [] };
  }
};

module.exports = {
  getDynamicGlobalProperties,
  getCurrentPriceInfo,
  calculateVotePower,
  getProcessedVotes,
  getMutedList,
  getUsers,
  getUser,
  handleVoteInPost,
  getPostNetRshares,
};
