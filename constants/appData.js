const getAppData = () => ({
  appName: process.env.APP_NAME || 'waiviodev',
});

const objectImportService = {
  production: {
    IMPORT_OBJECTS_SERVICE_HOST_URL: 'https://www.waivio.com/import-objects-service',
    IMPORT_TAGS_ROUTE: '/import-tags',
    IMPORT_UPDATES_ROUTE: '/import-wobjects',
  },
  staging: {
    IMPORT_OBJECTS_SERVICE_HOST_URL: 'https://waiviodev.com/import-objects-service',
    IMPORT_TAGS_ROUTE: '/import-tags',
    IMPORT_UPDATES_ROUTE: '/import-wobjects',
  },
  development: {
    IMPORT_OBJECTS_SERVICE_HOST_URL: 'http://localhost:8085/import-objects-service',
    IMPORT_TAGS_ROUTE: '/import-tags',
    IMPORT_UPDATES_ROUTE: '/import-wobjects',
  },
  test: {
    IMPORT_OBJECTS_SERVICE_HOST_URL: 'http://localhost:8085/import-objects-service',
    IMPORT_TAGS_ROUTE: '/import-tags',
    IMPORT_UPDATES_ROUTE: '/import-wobjects',
  },
};

const waivioApi = {
  production: {
    HOST: 'https://www.waivio.com',
    BASE_URL: '/api',
    IMPORT_STEEM_USER_ROUTE: '/import_steem_user',
  },
  staging: {
    HOST: 'https://waiviodev.com',
    BASE_URL: '/api',
    IMPORT_STEEM_USER_ROUTE: '/import_steem_user',
  },
  development: {
    HOST: 'http://localhost:3000',
    BASE_URL: '/api',
    IMPORT_STEEM_USER_ROUTE: '/import_steem_user',
  },
  test: {
    HOST: 'http://localhost:3000',
    BASE_URL: '/api',
    IMPORT_STEEM_USER_ROUTE: '/import_steem_user',
  },
};

const notificationsApi = {
  production: {
    HOST: 'https://www.waivio.com',
    BASE_URL: '/notifications-api',
    SET_NOTIFICATION: '/set',
    STATUS: ['relisted', 'nsfw', 'unavailable'],
  },
  staging: {
    HOST: 'https://waiviodev.com',
    BASE_URL: '/notifications-api',
    SET_NOTIFICATION: '/set',
    STATUS: ['relisted', 'nsfw', 'unavailable'],
  },
  development: {
    HOST: 'http://localhost:4000',
    BASE_URL: '/notifications-api',
    SET_NOTIFICATION: '/set',
    STATUS: ['relisted', 'nsfw', 'unavailable'],
  },
  test: {
    HOST: 'http://localhost:4000',
    BASE_URL: '/notifications-api',
    SET_NOTIFICATION: '/set',
    STATUS: ['relisted', 'nsfw', 'unavailable'],
  },
};

// valid urls of HIVE nodes for getting blocks with transactions.
const PRODUCTION_BLOCK_NODES = [
  'https://blocks.waivio.com',
  'https://anyx.io',
  'https://api.hive.blog',
  'https://rpc.ecency.com',
];

const STAGING_BLOCK_NODES = [
  'https://api.pharesim.me',
  'https://api.openhive.network',
  'https://rpc.esteem.app',
  'https://hive-api.arcange.eu',
  'https://hive.roelandp.nl',
  'https://rpc.ausbit.dev',
];

const BLOCK_NODES = process.env.NODE_ENV === 'production'
  ? PRODUCTION_BLOCK_NODES
  : STAGING_BLOCK_NODES;

const PRODUCTION_REQUEST_NODES = [
  'https://api.hive.blog',
  'https://rpc.ecency.com',
  'https://anyx.io',
];

const STAGING_REQUEST_NODES = [
  'https://api.openhive.network',
  'https://api.pharesim.me',
  'https://rpc.esteem.app',
  'https://hive-api.arcange.eu',
  'https://hive.roelandp.nl',
  'https://rpc.ausbit.dev',
];

const REQUEST_NODES = process.env.NODE_ENV === 'production'
  ? PRODUCTION_REQUEST_NODES
  : STAGING_REQUEST_NODES;

const REFERRAL_TYPES = {
  REWARDS: 'rewards',
  REVIEWS: 'reviews',
  INVITE_FRIEND: 'invite_friend',
};

const REFERRAL_STATUSES = {
  NOT_ACTIVATED: 'notActivated',
  ACTIVATED: 'activated',
  REJECTED: 'rejected',
};

const telegramApi = {
  HOST: 'https://waiviodev.com',
  BASE_URL: '/telegram-api',
  SENTRY_ERROR: '/sentry',

};

const BLOCK_REQ_MAX_TIME = 1000;

module.exports = {
  telegramApi,
  getAppData,
  objectImportService: objectImportService[process.env.NODE_ENV || 'development'],
  waivioApi: waivioApi[process.env.NODE_ENV || 'development'],
  notificationsApi: notificationsApi[process.env.NODE_ENV || 'development'],
  BLOCK_NODES,
  REFERRAL_TYPES,
  REFERRAL_STATUSES,
  REQUEST_NODES,
  BLOCK_REQ_MAX_TIME,
};
