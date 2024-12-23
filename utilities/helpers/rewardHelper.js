const { redisGetter, redis } = require('utilities/redis');
const { REDIS_KEYS } = require('constants/parsersData');

const getUSDFromRshares = async (weight) => {
  const priceInfo = await redisGetter
    .getHashAll(REDIS_KEYS.CURRENT_PRICE_INFO, redis.lastBlockClient);

  const rewardBalanceNumber = parseFloat(priceInfo.reward_balance.replace(' HIVE', ''));
  return (weight / parseFloat(priceInfo.recent_claims)) * rewardBalanceNumber
    * parseFloat(priceInfo.price);
};

const getRsharesFromUSD = async (usdAmount) => {
  const priceInfo = await redisGetter
    .getHashAll(REDIS_KEYS.CURRENT_PRICE_INFO, redis.lastBlockClient);

  const rewardBalanceNumber = parseFloat(priceInfo.reward_balance.replace(' HIVE', ''));
  return (usdAmount / (rewardBalanceNumber * parseFloat(priceInfo.price)))
    * parseFloat(priceInfo.recent_claims);
};

const getWeightForFieldUpdate = async (weight) => {
  // ignore users with zero or negative weight in wobject
  if (!weight || weight <= 0) return 1;
  // now we have weight in usd and need to adjust it to old votes
  const rshares = await getRsharesFromUSD(weight);

  return Math.round(Number(rshares) * 1e-6);
};

module.exports = {
  getUSDFromRshares,
  getRsharesFromUSD,
  getWeightForFieldUpdate,
};
