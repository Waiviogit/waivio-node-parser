const { REQ_NODE_URLS } = require('constants/appData');
const { Client } = require('@hiveio/dhive');

const client = new Client(REQ_NODE_URLS, { timeout: 8 * 1000, failoverThreshold: 0 });

module.exports = { client };
