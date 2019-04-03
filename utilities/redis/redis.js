const redis = require('redis');
const bluebird = require('bluebird');
const config = require('../../config');

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);
const postRefsClient = redis.createClient(process.env.REDISCLOUD_URL);
const tagsClient = redis.createClient(process.env.REDISCLOUD_URL);
postRefsClient.select(config.redis.wobjectsRefs);
tagsClient.select(config.redis.tagsRefs);

module.exports = {postRefsClient, tagsClient};
