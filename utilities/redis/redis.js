const redis = require('redis');
const bluebird = require('bluebird');
const config = require('config');
const redisHelper = require('utilities/redis/redisHelper');

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);
const postRefsClient = redis.createClient(config.redisCloudUrl);
const lastBlockClient = redis.createClient(config.redisCloudUrl);
const expiredPostsClient = redis.createClient(config.redisCloudUrl);
const mainFeedsCacheClient = redis.createClient(config.redisCloudUrl);
const campaignClient = redis.createClient(config.redisCloudUrl);

postRefsClient.select(config.redis.wobjectsRefs);
lastBlockClient.select(config.redis.lastBlock);
expiredPostsClient.select(config.redis.expiredPosts);
mainFeedsCacheClient.select(config.redis.mainFeedsCache);
campaignClient.select(config.redis.campaigns);

const publisher = redis.createClient({ db: config.redis.expiredPosts });
const tagCategoriesClient = redis.createClient({ db: config.redis.tagCategories });

const expiredListener = (onMessageCallBack) => {
  const subscribeExpired = () => {
    const subscriber = redis.createClient({ db: config.redis.expiredPosts });
    const expiredSubKey = `__keyevent@${config.redis.expiredPosts}__:expired`;

    redisHelper.expiredForecast(subscriber, expiredSubKey, onMessageCallBack);
  };
  publisher.send_command('config', ['Ex'], subscribeExpired);
};

module.exports = {
  postRefsClient,
  lastBlockClient,
  expiredPostsClient,
  expiredListener,
  tagCategoriesClient,
  mainFeedsCacheClient,
  campaignClient,
};
