const getAppData = () => {
    return{
        appName: process.env.APP_NAME || 'waiviodev'
    };
};

const objectImportService = {
    production: {
        IMPORT_OBJECTS_SERVICE_HOST_URL: 'https://www.waivio.com/import-objects-service',
        IMPORT_TAGS_ROUTE: '/import-tags',
        IMPORT_UPDATES_ROUTE: '/import-wobjects'
    },
    staging: {
        IMPORT_OBJECTS_SERVICE_HOST_URL: 'https://waiviodev.com/import-objects-service',
        IMPORT_TAGS_ROUTE: '/import-tags',
        IMPORT_UPDATES_ROUTE: '/import-wobjects'
    },
    development: {
        IMPORT_OBJECTS_SERVICE_HOST_URL: 'http://localhost:8085/import-objects-service',
        IMPORT_TAGS_ROUTE: '/import-tags',
        IMPORT_UPDATES_ROUTE: '/import-wobjects'
    },
    test: {
        IMPORT_OBJECTS_SERVICE_HOST_URL: 'http://localhost:8085/import-objects-service',
        IMPORT_TAGS_ROUTE: '/import-tags',
        IMPORT_UPDATES_ROUTE: '/import-wobjects'
    }

};

const nodeUrls = [ 'https://api.steemit.com', 'https://anyx.io', 'https://api.steem.house' ];

module.exports = {
    getAppData,
    objectImportService: objectImportService[ process.env.NODE_ENV || 'development' ],
    nodeUrls
};
