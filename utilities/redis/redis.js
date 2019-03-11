const redis = require('redis');
const bluebird = require('bluebird');

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);
const wobjRefsClient = redis.createClient(process.env.REDISCLOUD_URL);
const tagsClient = redis.createClient(process.env.REDISCLOUD_URL);
wobjRefsClient.select(1);
tagsClient.select(2);

module.exports = {wobjRefsClient, tagsClient};
