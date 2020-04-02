const axios = require('axios');
const _ = require('lodash');

/**
 * Get block data from blockchain by number and node url
 * @param blockNum {Number} required
 * @param hostUrl {String} default blocks.waivio.com
 * @returns {Promise<{error: string}|{block: *}|{error: *}>}
 */
exports.getBlock = async (blockNum, hostUrl = 'https://blocks.waivio.com') => {
  try {
    const resp = await axios.post(hostUrl, {
      jsonrpc: '2.0',
      method: 'condenser_api.get_block',
      params: [blockNum],
      id: 1,
    });
    return { block: _.get(resp, 'data.result') };
  } catch (error) {
    return { error };
  }
};
