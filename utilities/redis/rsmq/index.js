const RedisSMQ = require('rsmq');
const config = require('config');

const rsmqClient = new RedisSMQ({ options: { db: config.redis.actionsQueue } });

module.exports = {
  rsmqClient,
  redisQueue: require('./redisQueue'),
};
