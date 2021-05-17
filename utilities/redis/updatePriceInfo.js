const _ = require('lodash');
const { getCurrentPriceInfo, getDynamicGlobalProperties } = require('utilities/steemApi/usersUtil');
const { setCurrentPriceInfo, setDynamicGlobalProperties } = require('utilities/redis/redisSetter');

exports.update = async () => {
  const { rewardFund, currentPrice: price, error } = await getCurrentPriceInfo();
  if (error) return;
  const data = _.flatten(Object.entries(rewardFund));
  data.push('price', price);
  await setCurrentPriceInfo(data);
};

exports.setDynamicGlobalProperties = async () => {
  const { result, error } = await getDynamicGlobalProperties();
  if (!result || error) return;
  await setDynamicGlobalProperties(result);
};
