const axios = require('axios');
const { objectImportService, apiKey } = require('config');

const { IMPORT_OBJECTS_SERVICE_HOST_URL, IMPORT_UPDATES_ROUTE } = objectImportService;
const URL = IMPORT_OBJECTS_SERVICE_HOST_URL + IMPORT_UPDATES_ROUTE;

const send = async (wobjects) => {
  if (wobjects && Array.isArray(wobjects) && wobjects.length) {
    try {
      const { data: response } = await axios.post(
        URL,
        { wobjects, immediately: true },
        { headers: { 'api-key': apiKey } },
      );

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
