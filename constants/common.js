const ERROR = {
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

const SUPPORTED_CURRENCIES = {
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
  CHF: 'CHF',
};

const LANGUAGES = [
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

const APP_LANGUAGES = LANGUAGES.filter((el) => el !== 'auto');

const APP_ADSENCE_LEVELS = {
  MINIMAL: 'minimal',
  MODERATE: 'moderate',
  INTENSIVE: 'intensive',
};

const MIN_REDIS_REFS_IDLE_TIME_IN_SEC = 2592000;

const COMMENT_REF_TYPES = {
  postWithWobjects: 'post_with_wobj',
  createWobj: 'create_wobj',
  appendWobj: 'append_wobj',
  wobjType: 'wobj_type',
};

const REDIS_KEY_VOTE_UPDATES = 'votesUpdate';
const REDIS_KEY_CHILDREN_UPDATE = 'commentsCounterUpdate';
const REDIS_QUEUE_DELETE_COMMENT = 'delete_comment';
const REDIS_KEY_TICKERS = 'tickers_threads';
const GREY_LIST_KEY = 'vote_grey_list';

const REDIS_KEY_DISTRIBUTE_HIVE_ENGINE_REWARD = 'distributeHiveEngineReward';
const EXPIRE_DISTRIBUTE_HIVE_ENGINE_REWARD = 345600;

const HIVE_ENGINE_TOKEN_TAGS = {
  WAIV: ['waivio', 'neoxian', 'palnet', 'waiv', 'food'],
};

const THREADS_ACC = 'leothreads';
const ECENCY_THREADS_ACC = 'ecency.waves';
const THREAD_ACCOUNTS = [THREADS_ACC, ECENCY_THREADS_ACC];

const THREAD_TYPE_LEO = 'leothreads';
const THREAD_TYPE_ECENCY = 'ecencythreads';
const THREAD_TYPES = [THREAD_TYPE_LEO, THREAD_TYPE_ECENCY];

const VOTE_FIELDS = ['voter', 'percent', 'rshares', 'rsharesWAIV'];

module.exports = {
  ERROR,
  SUPPORTED_CURRENCIES,
  LANGUAGES,
  APP_LANGUAGES,
  APP_ADSENCE_LEVELS,
  MIN_REDIS_REFS_IDLE_TIME_IN_SEC,
  COMMENT_REF_TYPES,
  REDIS_KEY_VOTE_UPDATES,
  REDIS_KEY_CHILDREN_UPDATE,
  REDIS_QUEUE_DELETE_COMMENT,
  REDIS_KEY_TICKERS,
  GREY_LIST_KEY,
  REDIS_KEY_DISTRIBUTE_HIVE_ENGINE_REWARD,
  EXPIRE_DISTRIBUTE_HIVE_ENGINE_REWARD,
  HIVE_ENGINE_TOKEN_TAGS,
  THREADS_ACC,
  ECENCY_THREADS_ACC,
  THREAD_ACCOUNTS,
  THREAD_TYPE_LEO,
  THREAD_TYPE_ECENCY,
  THREAD_TYPES,
  VOTE_FIELDS,
};
