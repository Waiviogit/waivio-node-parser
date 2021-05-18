const _ = require('lodash');
const { getCurrentPriceInfo, getDynamicGlobalProperties } = require('utilities/steemApi/usersUtil');
const { hmsetAsync } = require('utilities/redis/redisSetter');

exports.update = async () => {
  const { rewardFund, currentPrice: price, error } = await getCurrentPriceInfo();
  if (error) return;
  const data = _.flatten(Object.entries(rewardFund));
  data.push('price', price);
  await hmsetAsync('current_price_info', data);
};

exports.setDynamicGlobalProperties = async () => {
  const { result, error } = await getDynamicGlobalProperties();
  if (!result || error) return;
  await hmsetAsync('dynamic_global_properties', result);
};
