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
    WS: 'wss://www.waivio.com',
    BASE_URL: '/notifications-api',
    SET_NOTIFICATION: '/set',
    STATUS: ['relisted', 'nsfw', 'unavailable'],
    WS_SET_NOTIFICATION: 'setNotification',
  },
  staging: {
    HOST: 'https://waiviodev.com',
    WS: 'wss://waiviodev.com',
    BASE_URL: '/notifications-api',
    SET_NOTIFICATION: '/set',
    STATUS: ['relisted', 'nsfw', 'unavailable'],
    WS_SET_NOTIFICATION: 'setNotification',
  },
  development: {
    HOST: 'http://localhost:4000',
    WS: 'ws://localhost:4000',
    BASE_URL: '/notifications-api',
    SET_NOTIFICATION: '/set',
    STATUS: ['relisted', 'nsfw', 'unavailable'],
    WS_SET_NOTIFICATION: 'setNotification',
  },
  test: {
    HOST: 'http://localhost:4000',
    WS: 'ws://localhost:4000',
    BASE_URL: '/notifications-api',
    SET_NOTIFICATION: '/set',
    STATUS: ['relisted', 'nsfw', 'unavailable'],
    WS_SET_NOTIFICATION: 'setNotification',
  },
};

// valid urls of HIVE nodes for getting blocks with transactions.
const COMMON_RPC_NODES = [
  'https://anyx.io',
  'https://api.hive.blog',
  'https://api.openhive.network',
  'https://rpc.ausbit.dev',
  'https://rpc.ecency.com',
  'https://hive-api.arcange.eu',
];

const HIVED_NODES = [
  'https://blocks.waivio.com',
  ...COMMON_RPC_NODES,
];

const HIVE_MIND_NODES = [
  'https://blocks.waivio.com:8082',
  ...COMMON_RPC_NODES,
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
  REFERRAL_TYPES,
  REFERRAL_STATUSES,
  BLOCK_REQ_MAX_TIME,
  HIVED_NODES,
  HIVE_MIND_NODES,
};
