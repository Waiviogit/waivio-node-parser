const axios = require('axios');
const config = require('config');

const { HOST, BASE_URL, CHECK_PAYPAL_SUBSCRIPTION } = config.waivioApi;
const URL = `${HOST}${BASE_URL}${CHECK_PAYPAL_SUBSCRIPTION}`;

/**
 * Send request to Waivio-Api to check paypal subscription
 * @param host {String}
 * @returns {Promise<{error: *}|{response: T}|{error: {message: string}}>}
 */
exports.send = async ({ host }) => {
  try {
    const { data: response } = await axios.post(
      URL,
      { host },
      {
        headers: { 'api-key': config.serviceApiKey },
      },
    );
    if (response && response.ok) {
      return { response };
    }
    return { error: new Error('request failed') };
  } catch (error) {
    return { error };
  }
};
