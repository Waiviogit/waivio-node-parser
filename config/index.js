const config = require('config/config.json')[process.env.NODE_ENV || 'development'];

const envConfig = {
  mongoConnectionString: process.env.MONGO_URI_WAIVIO || `mongodb://${config.db.host}:${config.db.port}/${config.db.database}`,
  environment: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3003,
  sentryDsn: process.env.SENTRY_DNS,
  apiKey: process.env.API_KEY,
  nginxKey: process.env.NGINX_KEY,
  serviceApiKey: process.env.SERVICE_API_KEY,
  guestHotAccount: process.env.GUEST_HOT_ACC,
  guestHotKey: process.env.GUEST_HOT_KEY,
  appName: process.env.APP_NAME || 'waiviodev',
  parseOnlyVotes: process.env.PARSE_ONLY_VOTES === 'true',
  dynamicHashtags: process.env.DYNAMIC_HASHTAGS === 'true',
  startFromCurrent: process.env.START_FROM_CURRENT === 'true',
  restoreRedis: process.env.RESTORE_REDIS === 'true',
  startFromBlock: process.env.START_FROM_BLOCK,
  redisCloudUrl: process.env.REDISCLOUD_URL,
  canMuteGlobal: process.env.CAN_MUTE_GLOBAL
    ? process.env.CAN_MUTE_GLOBAL.split(',')
    : [],
};

const telegramApi = {
  HOST: 'https://waiviodev.com',
  BASE_URL: '/telegram-api',
  SENTRY_ERROR: '/sentry',
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

const waivioApi = {
  production: {
    HOST: 'https://www.waivio.com',
    BASE_URL: '/api',
    IMPORT_STEEM_USER_ROUTE: '/import_steem_user',
    RECOUNT_LIST_ITEMS: '/wobjects/list-item-process',
  },
  staging: {
    HOST: 'https://waiviodev.com',
    BASE_URL: '/api',
    IMPORT_STEEM_USER_ROUTE: '/import_steem_user',
    RECOUNT_LIST_ITEMS: '/wobjects/list-item-process',
  },
  development: {
    HOST: 'http://localhost:3000',
    BASE_URL: '/api',
    IMPORT_STEEM_USER_ROUTE: '/import_steem_user',
    RECOUNT_LIST_ITEMS: '/wobjects/list-item-process',
  },
  test: {
    HOST: 'http://localhost:3000',
    BASE_URL: '/api',
    IMPORT_STEEM_USER_ROUTE: '/import_steem_user',
    RECOUNT_LIST_ITEMS: '/wobjects/list-item-process',
  },
};

const nginxApi = {
  production: {
    HOST: 'https://www.waivio.com',
    BASE_URL: '/nginx',
    ADD_CONFIG: '/add-site',
    REMOVE_CONFIG: '/remove-site',
  },
  staging: {
    HOST: 'https://waiviodev.com',
    BASE_URL: '/nginx',
    ADD_CONFIG: '/add-site',
    REMOVE_CONFIG: '/remove-site',
  },
  development: {
    HOST: 'http://localhost:3000',
    BASE_URL: '/nginx',
    ADD_CONFIG: '/add-site',
    REMOVE_CONFIG: '/remove-site',
  },
  test: {
    HOST: 'http://localhost:3000',
    BASE_URL: '/nginx',
    ADD_CONFIG: '/add-site',
    REMOVE_CONFIG: '/remove-site',
  },
};

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

const commonConfig = {
  seoServiceBaseUrl: process.env.NODE_ENV === 'production'
    ? 'https://www.waivio.com/seo-service'
    : 'https://waiviodev.com/seo-service',
  objectImportService: objectImportService[process.env.NODE_ENV || 'development'],
  waivioApi: waivioApi[process.env.NODE_ENV || 'development'],
  notificationsApi: notificationsApi[process.env.NODE_ENV || 'development'],
  nginxApi: nginxApi[process.env.NODE_ENV || 'development'],
  telegramApi,
  createObjectTypeList: [
    'flowmaster',
    'wiv01',
  ],
};

module.exports = Object.freeze({
  ...config,
  ...envConfig,
  ...commonConfig,
});
