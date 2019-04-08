const config = require('../../../config');
const RedisSMQ = require("rsmq");
const importRsmqClient = new RedisSMQ({ns: 'rsmq', options: {db: config.redis.importQueue}});

module.exports = {importRsmqClient}
