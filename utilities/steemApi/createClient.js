const dhive = require('@hiveio/dhive');

const client = new dhive.Client(['https://api.hive.blog'], {
  timeout: 8 * 1000,
  failoverThreshold: 4,
  rebrandedApi: true,
});

module.exports = { client };
