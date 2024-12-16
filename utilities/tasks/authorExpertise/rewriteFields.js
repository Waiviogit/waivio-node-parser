const {
  WObject,
} = require('database').models;
const _ = require('lodash');
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

  // const wobjects = WObject.find({ processed: false });
  const wobjects = WObject.find({ processed: false });
  for await (const wobject of wobjects) {
    for (const field of wobject.fields) {
      if ([0, 1, -1].includes(field.weight)) continue;
      for (const vote of field.active_votes) {
        if ([0, 1, -1].includes(vote.weight)) continue;
        const waivWeight = vote.weightWAIV || 0;
        const hiveWeight = vote.rshares_weight;
        const overallWeight = vote.weight;
        let waivUsd = 0;

        let usdExpertise = await getUSDFromRshares(hiveWeight * 1000000); // + Waiv
        if (waivWeight !== 0) {
          waivUsd = (waivWeight * price * rewards);
          usdExpertise += waivUsd;
        }

        const oldWeight = (overallWeight / (vote.percent / 10000)) - (vote.rshares_weight * 0.25);
        const newWeight = (oldWeight + usdExpertise * 0.5) * (vote.percent / 10000);
        vote.weight = Number.isNaN(newWeight) ? 0 : Number(newWeight.toFixed(8));
        if (waivWeight) vote.weightWAIV = 0;
      }

      const fieldWeight = _.reduce(field.active_votes, (acc, el) => {
        acc += el.weight;
        return acc;
      }, 0);

      field.weight = Number(fieldWeight.toFixed(8));
      if (field.weightWAIV) {
        field.weightWAIV = 0;
      }
    }
    wobject.processed = true;
    await wobject.save();
  }
};

module.exports = rewriteFields;
