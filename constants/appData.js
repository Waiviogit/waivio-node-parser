const appData = {
    appName: 'busy',
    version: '2.5.6',
    appAccName: 'monterey',
    appendObjectTag: 'waivio-object'
};

const objectImportService = {
    production: {
        IMPORT_OBJECTS_SERVICE_HOST_URL: 'https://waiviodev.com/import-objects-service',
        IMPORT_TAGS_ROUTE: '/import-tags'
    },
    development: {
        IMPORT_OBJECTS_SERVICE_HOST_URL: 'http://localhost:8085/import-objects-service' ,
        IMPORT_TAGS_ROUTE: '/import-tags'
    },
    test: {
        IMPORT_OBJECTS_SERVICE_HOST_URL: 'http://localhost:8085/import-objects-service',
        IMPORT_TAGS_ROUTE: '/import-tags'
    }

};

module.exports = {
    appData,
    objectImportService: objectImportService[ process.env.NODE_ENV || 'development' ]
};
