const _ = require('lodash');

exports.ERROR = {
  INVALID_JSON: 'JSON not valid',
  HIDE_POST: '[hiddenPost]:Can\'t find post or user',
  SUBSCRIBE_NOTIFICATIONS: 'Can\'t subscribe for notifications, account and author of operation are different',
  FOLLOW_USER_PARSER_REBLOG: 'Can\'t reblog, account and author of operation are different',
  FOLLOW_USER_PARSER_FOLLOW_DIFFERENT: 'Can\'t follow(reblog), follower(account) and author of operation are different',
  FOLLOW_USER_PARSER_FOLLOW_SAME: 'Can\'t follow, follower and following are the same',
  CUSTOM_JSON_APPEND_VOTE: 'Can\'t vote, account and author of operation are different',
  FOLLOW_OBJECT_PARSER: 'Can\'t follow, follower and author of operation are different',
  NOT_FOUND: 'Not Found',
};

exports.SUPPORTED_CURRENCIES = {
  USD: 'USD',
  CAD: 'CAD',
  EUR: 'EUR',
  AUD: 'AUD',
  MXN: 'MXN',
  GBP: 'GBP',
  JPY: 'JPY',
  CNY: 'CNY',
  RUB: 'RUB',
  UAH: 'UAH',
};

exports.LANGUAGES = [
  'en-US',
  'id-ID',
  'ms-MY',
  'ca-ES',
  'cs-CZ',
  'da-DK',
  'de-DE',
  'et-EE',
  'es-ES',
  'fil-PH',
  'fr-FR',
  'hr-HR',
  'it-IT',
  'hu-HU',
  'nl-HU',
  'no-NO',
  'pl-PL',
  'pt-BR',
  'ro-RO',
  'sl-SI',
  'sv-SE',
  'vi-VN',
  'tr-TR',
  'yo-NG',
  'el-GR',
  'bg-BG',
  'ru-RU',
  'uk-UA',
  'he-IL',
  'ar-SA',
  'ne-NP',
  'hi-IN',
  'as-IN',
  'bn-IN',
  'ta-IN',
  'lo-LA',
  'th-TH',
  'ko-KR',
  'ja-JP',
  'zh-CN',
  'af-ZA',
  'auto',
];

exports.APP_LANGUAGES = _.filter(this.LANGUAGES, (el) => el !== 'auto');

exports.MIN_REDIS_REFS_IDLE_TIME_IN_SEC = 2592000;

exports.COMMENT_REF_TYPES = {
  postWithWobjects: 'post_with_wobj',
  createWobj: 'create_wobj',
  appendWobj: 'append_wobj',
  wobjType: 'wobj_type',
};

exports.REDIS_KEY_VOTE_UPDATES = 'votesUpdate';
exports.REDIS_KEY_CHILDREN_UPDATE = 'commentsCounterUpdate';

exports.REDIS_KEY_DISTRIBUTE_HIVE_ENGINE_REWARD = 'distributeHiveEngineReward';
exports.EXPIRE_DISTRIBUTE_HIVE_ENGINE_REWARD = 345600;

exports.HIVE_ENGINE_TOKEN_TAGS = {
  WAIV: ['waivio', 'neoxian', 'palnet'],
};

exports.VOTE_FIELDS = ['voter', 'percent', 'rshares', 'rsharesWAIV'];
