const _ = require('lodash');
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

const calculateVotePower = async ({ votesOps, posts }) => {
  const { users } = await getUsers(_.map(votesOps, 'voter'));

  for (const vote of votesOps) {
    const account = _.find(users, (el) => el.name === vote.voter);
    if (!account) continue;
    const voteWeight = vote.weight / 100;
    const decreasedPercent = ((voteWeight * 2) / 100);
    const votingPower = (100 * account.voting_power) / (100 - decreasedPercent);

    const vests = parseFloat(account.vesting_shares)
      + parseFloat(account.received_vesting_shares) - parseFloat(account.delegated_vesting_shares);

    const accountVotingPower = Math.min(10000, votingPower);

    const power = (((accountVotingPower / 100) * voteWeight)) / 50;
    const rShares = Math.abs((vests * power * 100)) > 50000000
      ? (vests * power * 100) - 50000000
      : 0;
    const post = _.find(posts, (p) => p.author === vote.author && p.permlink === vote.permlink);
    if (!post) continue;
    post.active_votes.push({
      voter: vote.voter,
      percent: vote.weight,
      rshares: Math.round(rShares),
    });
  }
  return posts;
};

module.exports = { getUser, getUsers, calculateVotePower };
