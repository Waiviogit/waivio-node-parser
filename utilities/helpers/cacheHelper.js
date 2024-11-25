const redisSetter = require('utilities/redis/redisSetter');
const redisGetter = require('utilities/redis/redisGetter');
const redis = require('utilities/redis/redis');
const jsonHelper = require('utilities/helpers/jsonHelper');

const getCachedData = async (key) => redisGetter.getAsync({
  key,
  client: redis.mainFeedsCacheClient,
});

const setCachedData = async ({
  key,
  data,
  ttl,
}) => {
  await redisSetter.setEx({
    key, value: JSON.stringify(data), ttlSeconds: ttl, client: redis.mainFeedsCacheClient,
  });
};

const cacheWrapper = (fn) => (...args) => async ({ key, ttl }) => {
  const cache = await getCachedData(key);
  if (cache) {
    const parsed = jsonHelper.parseJson(cache, null);
    if (parsed) return parsed;
  }
  const result = await fn(...args);

  if (!result?.error) {
    await setCachedData({ key, data: result, ttl });
  }
  return result;
};

module.exports = {
  cacheWrapper,
};
