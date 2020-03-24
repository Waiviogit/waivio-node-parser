const axios = require('axios');
const { IMPORT_OBJECTS_SERVICE_HOST_URL, IMPORT_UPDATES_ROUTE } = require('constants/appData').objectImportService;

const URL = IMPORT_OBJECTS_SERVICE_HOST_URL + IMPORT_UPDATES_ROUTE;

const send = async (wobjects) => {
  if (wobjects && Array.isArray(wobjects) && wobjects.length) {
    try {
      const { data: response } = await axios.post(URL,
        { wobjects, immediately: true }, { headers: { API_KEY: process.env.API_KEY } });

      if (response) {
        return { response };
      }
      return { error: { message: 'Not enough response data!' } };
    } catch (error) {
      return { error };
    }
  }
};

module.exports = { send };
