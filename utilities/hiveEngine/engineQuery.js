const axios = require('axios');
const _ = require('lodash');

module.exports = async ({
  hostUrl = 'http://65.21.50.97:5000',
  method = 'find',
  params,
  endpoint = '/contracts',
  id = 'ssc-testnet-hive',
}) => {
  try {
    const instance = axios.create();
    const resp = await instance.post(
      `${hostUrl}${endpoint}`,
      {
        jsonrpc: '2.0',
        method,
        params,
        id,
      },
    );
    return _.get(resp, 'data.result');
  } catch (error) {
    return { error };
  }
};
