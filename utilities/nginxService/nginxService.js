const axios = require('axios');
const {
  HOST, BASE_URL, ADD_CONFIG, REMOVE_CONFIG,
} = require('constants/appData').nginxApi;

/**
 * @param host {String}
 * @returns {Promise<{error: *}|{response: T}|{error: {message: string}}>}
 */
exports.createNginxConfig = async ({ host }) => {
  try {
    const url = `${HOST}${BASE_URL}${ADD_CONFIG}`;
    const { data: response } = await axios.post(url, { host }, { headers: { 'nginx-key': process.env.NGINX_KEY } });
    if (response && response.ok) {
      return { response };
    }
    return { error: { message: 'createNginxConfig error' } };
  } catch (error) {
    return { error };
  }
};

/**
 * @param host {String}
 * @returns {Promise<{error: *}|{response: T}|{error: {message: string}}>}
 */
exports.removeNginxConfig = async ({ host }) => {
  try {
    const url = `${HOST}${BASE_URL}${REMOVE_CONFIG}`;
    const { data: response } = await axios.post(url, { host }, { headers: { 'nginx-key': process.env.NGINX_KEY } });
    if (response && response.ok) {
      return { response };
    }
    return { error: { message: 'removeNginxConfig error' } };
  } catch (error) {
    return { error };
  }
};
