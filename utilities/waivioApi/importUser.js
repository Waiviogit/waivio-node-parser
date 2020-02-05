const axios = require('axios');
const { HOST, BASE_URL, IMPORT_STEEM_USER_ROUTE } = require('constants/appData').waivioApi;

const URL = HOST + BASE_URL + IMPORT_STEEM_USER_ROUTE;

module.exports = async (userName) => {
  try {
    const { data: response } = await axios.get(URL, { params: { userName } });
    if (response) {
      return { response };
    }
    return { error: { message: '[IMPORT STEEM USER TO WAIVIO-API]Not enough response data!' } };
  } catch (error) {
    return { error };
  }
};
