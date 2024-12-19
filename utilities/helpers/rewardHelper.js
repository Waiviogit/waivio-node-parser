const { getCurrentPriceInfo } = require('utilities/steemApi/usersUtil');
const { cacheWrapper } = require('utilities/helpers/cacheHelper');

const getCachedPriceInfo = cacheWrapper(getCurrentPriceInfo);
const CACHE_PRICE_KEY = 'cached_price_info';
const CACHE_PRICE_TTL = 60 * 5;
const cacheParams = { key: CACHE_PRICE_KEY, ttl: CACHE_PRICE_TTL };

const getUSDFromRshares = async (weight) => {
  const { currentPrice: rate, rewardFund } = await getCachedPriceInfo()(cacheParams);
  const { recent_claims: recentClaims, reward_balance: rewardBalance } = rewardFund;
  return (weight / recentClaims) * rewardBalance.replace(' HIVE', '') * rate;
};

const getRsharesFromUSD = async (usdAmount) => {
  const { currentPrice: rate, rewardFund } = await getCachedPriceInfo()(cacheParams);
  const { recent_claims: recentClaims, reward_balance: rewardBalance } = rewardFund;
  const rewardBalanceNumber = parseFloat(rewardBalance.replace(' HIVE', ''));
  return (usdAmount / (rewardBalanceNumber * rate)) * recentClaims;
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
