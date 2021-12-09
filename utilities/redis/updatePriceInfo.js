const _ = require('lodash');
const { getCurrentPriceInfo, getDynamicGlobalProperties } = require('utilities/steemApi/usersUtil');
const { hmsetAsync } = require('utilities/redis/redisSetter');
const { REDIS_KEYS } = require('constants/parsersData');

exports.update = async () => {
  const { rewardFund, currentPrice: price, error } = await getCurrentPriceInfo();
  if (error) return;
  const data = _.flatten(Object.entries(rewardFund));
  data.push('price', price);
  await hmsetAsync(REDIS_KEYS.CURRENT_PRICE_INFO, data);
};

exports.setDynamicGlobalProperties = async () => {
  const { result, error } = await getDynamicGlobalProperties();
  if (!result || error) return;
  await hmsetAsync(REDIS_KEYS.DYNAMIC_GLOBAL_PROPERTIES, result);
};
