const axios = require('axios');
const { HOST, BASE_URL, RECOUNT_LIST_ITEMS } = require('constants/appData').waivioApi;

const URL = `${HOST}${BASE_URL}${RECOUNT_LIST_ITEMS}`;

/**
 * Send request to Waivio-Api to start process of recount list item members
 * @param authorPermlink {String}
 * @param listItemLink {String}
 * @returns {Promise<{error: *}|{response: T}|{error: {message: string}}>}
 */
exports.send = async ({ authorPermlink, listItemLink }) => {
  try {
    const { data: response } = await axios.post(
      URL,
      { authorPermlink, listItemLink },
      {
        headers: { 'api-key': process.env.SERVICE_API_KEY },
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
