const _ = require('lodash');
const { getCurrentPriceInfo } = require('utilities/steemApi/usersUtil');
const { setCurrentPriceInfo } = require('utilities/redis/redisSetter');

exports.update = async () => {
  const { rewardFund, currentPrice: price, error } = await getCurrentPriceInfo();
  if (error) return;
  const data = _.flatten(Object.entries(rewardFund));
  data.push('price', price);
  await setCurrentPriceInfo(data);
};
