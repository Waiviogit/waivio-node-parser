const { hivedClient, hiveMindClient } = require('utilities/steemApi/createClient');
const { getHashAll } = require('utilities/redis/redisGetter');
const { lastBlockClient } = require('utilities/redis/redis');
const { VOTE_TYPES, REDIS_KEYS } = require('constants/parsersData');
const moment = require('moment');
const _ = require('lodash');
const redisSetter = require('utilities/redis/redisSetter');
const redisGetter = require('utilities/redis/redisGetter');

const getUser = async (accountName) => {
  try {
    const [user] = await hivedClient.database.getAccounts([accountName]);
    return { user };
  } catch (error) {
    return { error };
  }
};

const getUsers = async (accountNames) => {
  try {
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
const getSortedVotes = async (votes) => {
  const expire = moment().subtract(1, 'days').valueOf();
  await redisSetter.zremrangebyscore({ key: REDIS_KEYS.KEY, start: -Infinity, end: expire });
  const votedPosts = await redisGetter.zrevrange({ key: REDIS_KEYS.KEY, start: 0, end: -1 });

  const resultVotes = _.filter(votes, (e) => !_.some(_.map(votedPosts, (el) => ({
    voter: el.split(':')[0],
    author: el.split(':')[1],
    permlink: el.split(':')[2],
  })), (l) => l.voter === e.voter && l.author === e.author && l.permlink === e.permlink));

  return { resultVotes, votedPosts };
};

const calculateVotePower = async ({ votesOps, posts, hiveAccounts }) => {
  const priceInfo = await getHashAll('current_price_info', lastBlockClient);

  const { resultVotes } = await getSortedVotes(votesOps);

  for (const vote of resultVotes) {
    if (!vote.type) continue;
    const account = _.find(hiveAccounts, (el) => el.name === vote.voter);
    const post = _.find(posts, (p) => (p.author === vote.author || p.author === vote.guest_author) && p.permlink === vote.permlink);
    if (!account) continue;
    const voteWeight = vote.weight / 100;
    const decreasedPercent = ((voteWeight * 2) / 100);
    // here we find out what was the votingPower before vote
    const votingPower = vote.type === VOTE_TYPES.APPEND_WOBJ && vote.json
      ? account.voting_power
      : (100 * account.voting_power) / (100 - decreasedPercent);

    const vests = parseFloat(account.vesting_shares)
      + parseFloat(account.received_vesting_shares) - parseFloat(account.delegated_vesting_shares);

    const accountVotingPower = Math.min(10000, votingPower);

    const power = (((accountVotingPower / 100) * voteWeight)) / 50;
    const rShares = Math.abs((vests * power * 100)) > 50000000
      ? (vests * power * 100) - 50000000
      : 0;
    const createdOverAWeek = moment().diff(moment(_.get(post, 'createdAt')), 'day') > 7;
    if (!post || createdOverAWeek) {
      vote.rshares = rShares || 1;
      continue;
    }
    vote.rshares = rShares;
    post.active_votes.push({
      voter: vote.voter,
      percent: vote.weight,
      rshares: Math.round(rShares),
      weight: Math.round(rShares * 1e-6),
    });
    // such vote will not affect total payout
    if (!rShares) continue;
    // net_rshares sum of all post active_votes rshares negative and positive
    const tRShares = parseFloat(_.get(post, 'net_rshares', 0)) + rShares;

    const rewards = parseFloat(priceInfo.reward_balance) / parseFloat(priceInfo.recent_claims);
    // *price - to calculate in HBD
    const postValue = tRShares * rewards * parseFloat(priceInfo.price);

    post.net_rshares = Math.round(tRShares);
    post.pending_payout_value = postValue < 0 ? '0.000 HBD' : `${postValue.toFixed(3)} HBD`;
  }
  return posts;
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
  getMutedList,
  getUsers,
  getUser,
  getSortedVotes,
};
