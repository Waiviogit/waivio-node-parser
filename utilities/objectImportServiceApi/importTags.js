const axios = require('axios');
const {IMPORT_OBJECTS_SERVICE_HOST_URL, IMPORT_TAGS_ROUTE} = require('../../constants/appData').objectImportService;
const URL = IMPORT_OBJECTS_SERVICE_HOST_URL + IMPORT_TAGS_ROUTE;

const send = async (tags) => {
    if (tags && Array.isArray(tags) && tags.length) {
        try {
            const {data: response} = await axios.post(URL, {tags});
            if (response) {
                return {response};
            } else {
                return {error: {message: 'Not enough response data!'}}
            }
        } catch (error) {
            return {error}
        }
    }
};

module.exports = {send};


