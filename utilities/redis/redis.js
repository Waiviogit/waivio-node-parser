const redis = require('redis');
const bluebird = require('bluebird');
const config = require('../../config');

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);
const postRefsClient = redis.createClient(process.env.REDISCLOUD_URL);
const lastBlockClient = redis.createClient(process.env.REDISCLOUD_URL);
const importWobjectsDataClient = redis.createClient(process.env.REDISCLOUD_URL);
const importWobjectsQueueClient = redis.createClient(process.env.REDISCLOUD_URL);
postRefsClient.select(config.redis.wobjectsRefs);
lastBlockClient.select(config.redis.lastBlock);
importWobjectsDataClient.select(config.redis.importWobjData);
importWobjectsQueueClient.select(config.redis.importQueue);

module.exports = {postRefsClient, lastBlockClient, importWobjectsDataClient, importWobjectsQueueClient};
