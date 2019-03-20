const redis = require('redis');
const bluebird = require('bluebird');

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);
const postRefsClient = redis.createClient(process.env.REDISCLOUD_URL);
const tagsClient = redis.createClient(process.env.REDISCLOUD_URL);
postRefsClient.select(1);
tagsClient.select(2);

module.exports = {postRefsClient, tagsClient};
