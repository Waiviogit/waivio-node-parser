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

module.exports = {
  getUSDFromRshares,
};
