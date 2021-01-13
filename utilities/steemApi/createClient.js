const dhive = require('@hiveio/dhive');

const client = new dhive.Client(['https://rpc.esteem.app', 'https://api.openhive.network', 'https://hive.roelandp.nl', 'https://hive-api.arcange.eu'], {
  timeout: 8 * 1000,
  failoverThreshold: 4,
  rebrandedApi: true,
});

module.exports = { client };
