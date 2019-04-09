const redis = require('redis');
const bluebird = require('bluebird');
const config = require('../../config');

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);
const postRefsClient = redis.createClient(process.env.REDISCLOUD_URL);
const tagsClient = redis.createClient(process.env.REDISCLOUD_URL);
const importWobjectsDataClient = redis.createClient(process.env.REDISCLOUD_URL);
const importWobjectsQueueClient = redis.createClient(process.env.REDISCLOUD_URL);
postRefsClient.select(config.redis.wobjectsRefs);
tagsClient.select(config.redis.tagsRefs);
importWobjectsDataClient.select(config.redis.importWobjData);
importWobjectsQueueClient.select(config.redis.importQueue);

module.exports = {postRefsClient, tagsClient, importWobjectsDataClient, importWobjectsQueueClient};
