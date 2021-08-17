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
const nodeUrls = [
  'https://rpc.esteem.app',
  'https://hive.roelandp.nl',
  'https://hive-api.arcange.eu',
  'https://hived.emre.sh',
];

const REQ_NODE_URLS = [
  'https://api.hive.blog',
  'https://rpc.esteem.app',
  'https://hived.emre.sh',
  'https://hive.roelandp.nl',
  'https://hive-api.arcange.eu',
];

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
  nodeUrls,
  REFERRAL_TYPES,
  REFERRAL_STATUSES,
  REQ_NODE_URLS,
  BLOCK_REQ_MAX_TIME,
};
