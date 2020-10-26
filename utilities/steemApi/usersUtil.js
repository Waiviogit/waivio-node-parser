const _ = require('lodash');
const { getHashAll } = require('utilities/redis/redisGetter');
const { lastBlockClient } = require('utilities/redis/redis');
const { client } = require('./createClient');

const getUser = async (accountName) => {
  try {
    const [user] = await client.database.getAccounts([accountName]);
    return { user };
  } catch (error) {
    return { error };
  }
};

const getUsers = async (accountNames) => {
  try {
    const users = await client.database.getAccounts(accountNames);
    return { users };
  } catch (error) {
    return { error };
  }
};
const parseToFloat = (balance) => parseFloat(balance.match(/.\d*.\d*/)[0]);

const getCurrentPriceInfo = async () => {
  const sbdMedian = await client.database.call('get_current_median_history_price', []);
  const rewardFund = await client.database.call('get_reward_fund', ['post']);
  return {
    currentPrice: parseToFloat(sbdMedian.base) / parseToFloat(sbdMedian.quote),
    rewardFund,
  };
};

const calculateVotePower = async ({ votesOps, posts, hiveAccounts }) => {
  if (_.isEmpty(posts)) return [];

  const priceInfo = await getHashAll('current_price_info', lastBlockClient);
  for (const vote of votesOps) {
    const account = _.find(hiveAccounts, (el) => el.name === vote.voter);
    const post = _.find(posts, (p) => p.author === vote.author && p.permlink === vote.permlink);
    if (!account || !post) continue;
    const voteWeight = vote.weight / 100;
    const decreasedPercent = ((voteWeight * 2) / 100);
    // here we find out what was the votingPower before vote
    const votingPower = (100 * account.voting_power) / (100 - decreasedPercent);

    const vests = parseFloat(account.vesting_shares)
      + parseFloat(account.received_vesting_shares) - parseFloat(account.delegated_vesting_shares);

    const accountVotingPower = Math.min(10000, votingPower);

    const power = (((accountVotingPower / 100) * voteWeight)) / 50;
    const rShares = Math.abs((vests * power * 100)) > 50000000
      ? (vests * power * 100) - 50000000
      : 0;

    post.active_votes.push({
      voter: vote.voter,
      percent: vote.weight,
      rshares: Math.round(rShares),
      weight: Math.round(rShares * 1e-6),
    });
    // such vote will not affect total payout
    if (!rShares) continue;
    // net_rshares sum of all post active_votes rshares negative and positive
    const tRShares = parseFloat(post.net_rshares) + rShares;
    const s = parseFloat(priceInfo.content_constant);
    const tClaims = (tRShares * (tRShares + (2 * s))) / (tRShares + (4 * s));

    const rewards = parseFloat(priceInfo.reward_balance) / parseFloat(priceInfo.recent_claims);
    // *price - to calculate in HBD
    const postValue = tClaims * rewards * parseFloat(priceInfo.price);

    post.net_rshares = Math.round(tRShares);
    post.pending_payout_value = postValue < 0 ? '0.000 HBD' : `${postValue.toFixed(3)} HBD`;
  }
  return posts;
};

module.exports = {
  getUser, getUsers, calculateVotePower, getCurrentPriceInfo,
};
