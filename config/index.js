const config = require('config/config.json');

module.exports = config[process.env.NODE_ENV || 'development'];
