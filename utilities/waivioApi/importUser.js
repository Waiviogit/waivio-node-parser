const axios = require('axios');
const config = require('config');

const { HOST, BASE_URL, IMPORT_STEEM_USER_ROUTE } = config.waivioApi;
const URL = HOST + BASE_URL + IMPORT_STEEM_USER_ROUTE;

/**
 * Send request to Waivio-Api to start process of import user info form STEEM
 * @param userName {String}
 * @returns {Promise<{error: *}|{response: T}|{error: {message: string}}>}
 */
exports.send = async (userName) => {
  try {
    const { data: response } = await axios.get(URL, { params: { userName } });
    if (response && response.ok) {
      return { response };
    }
    return { error: { message: '[IMPORT STEEM USER TO WAIVIO-API]Not enough response data!' } };
  } catch (error) {
    return { error };
  }
};
