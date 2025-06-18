exports.TOKEN_WAIV = {
  SYMBOL: 'WAIV',
  POOL_ID: 13,
  TAGS: ['waivio', 'neoxian', 'palnet', 'waiv', 'food'],
  MARKET_POOL_ID: 63,
};

exports.ENGINE_TOKENS = [this.TOKEN_WAIV];

exports.ENGINE_CUSTOM_METHODS = {
  CREATE_DEPOSIT_RECORD: 'createDepositRecord',
};

exports.HIVE_ENGINE_NODES = [
  'https://herpc.dtools.dev',
  'https://engine.rishipanthee.com',
  'https://api2.hive-engine.com/rpc',
  'https://api.primersion.com',
  'https://herpc.kanibot.com',
];

exports.CACHE_POOL_KEY = 'smt_pool';
exports.CACH_MARKET_POOL_KEY = 'market_pool';
exports.MAX_VOTING_POWER = 10000;
exports.VOTE_REGENERATION_DAYS = 5;
exports.DOWNVOTE_REGENERATION_DAYS = 5;
