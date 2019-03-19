const redis = require('redis');
const bluebird = require('bluebird');

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);
const postRefsClient = redis.createClient(process.env.REDISCLOUD_URL);
const tagsClient = redis.createClient(process.env.REDISCLOUD_URL);
const commentRefsClient = redis.createClient(process.env.REDISCLOUD_URL);
.select(1);
tagsClient.select(2);
commentRefsClient.select(3);

module.exports = {postRefsClient, tagsClient, commentRefsClient};
