const redis = require('redis');
const bluebird = require('bluebird');
const config = require('config');
const redisHelper = require('utilities/redis/redisHelper');

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);
const postRefsClient = redis.createClient(process.env.REDISCLOUD_URL);
const lastBlockClient = redis.createClient(process.env.REDISCLOUD_URL);
const expiredPostsClient = redis.createClient(process.env.REDISCLOUD_URL);

postRefsClient.select(config.redis.wobjectsRefs);
lastBlockClient.select(config.redis.lastBlock);
expiredPostsClient.select(config.redis.expiredPosts);

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
  postRefsClient, lastBlockClient, expiredPostsClient, expiredListener, tagCategoriesClient,
};
