const { REQUEST_NODES } = require('constants/appData');
const { Client } = require('@hiveio/dhive');

const client = new Client(REQUEST_NODES, { timeout: 8 * 1000, failoverThreshold: 0 });

module.exports = { client };
