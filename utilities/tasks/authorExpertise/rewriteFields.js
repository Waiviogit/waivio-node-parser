const {
  WObject,
} = require('database').models;
const { User } = require('models');
const { getUSDFromRshares } = require('utilities/helpers/rewardHelper');
const { redisGetter, redis } = require('utilities/redis');
const { engineProxy } = require('utilities/hiveEngine/engineQuery');

const rewriteFields = async () => {
  const { rewardPool, pendingClaims } = await redisGetter.getHashAll('smt_pool:WAIV', redis.lastBlockClient);
  const hiveCurrency = await redisGetter.getHashAll('current_price_info', redis.lastBlockClient);
  const rewards = parseFloat(rewardPool) / parseFloat(pendingClaims);

  const pools = await engineProxy({
    params: {
      contract: 'marketpools',
      table: 'pools',
      query: { _id: 63 },
    },
  });
  const { quotePrice } = pools[0];
  const price = parseFloat(quotePrice) * parseFloat(hiveCurrency.price);

  const wobjects = WObject.find({ processed: false });
  for await (const wobject of wobjects) {
    for (const field of wobject.fields) {
      if ([0, 1, -1].includes(field.weight)) continue;
      for (const vote of field.active_votes) {
        if ([0, 1, -1].includes(vote.weight)) continue;
        const waivWeight = vote.weightWAIV || 0;
        const hiveWeight = vote.rshares_weight;
        let waivUsd = 0;

        let usdExpertise = await getUSDFromRshares(hiveWeight * 1000000); // + Waiv
        if (waivWeight !== 0) {
          waivUsd = (waivWeight * price * rewards);
          usdExpertise += waivUsd;
        }
        const creatorWeight = Number((usdExpertise * 0.5 * (vote.percent / 10000)).toFixed(8));
        if (creatorWeight !== 0 && field.creator !== 'monterey') {
          await User.increaseWobjectWeight({
            name: field.creator,
            author_permlink: wobject.author_permlink,
            weight: creatorWeight,
          });
        }
      }
    }
    wobject.processed = true;
    await wobject.save();
  }
};

module.exports = rewriteFields;
