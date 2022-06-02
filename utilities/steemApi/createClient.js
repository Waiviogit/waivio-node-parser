const { HIVE_MIND_NODES, HIVED_NODES } = require('constants/appData');
const { Client } = require('@hiveio/dhive');

exports.hiveMindClient = new Client(HIVE_MIND_NODES, { timeout: 8 * 1000, failoverThreshold: 0 });

exports.hivedClient = new Client(HIVED_NODES, { timeout: 8 * 1000, failoverThreshold: 0 });
