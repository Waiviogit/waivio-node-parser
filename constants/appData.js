// valid urls of HIVE nodes for getting blocks with transactions.
const COMMON_RPC_NODES = [
  'https://api.deathwing.me',
  'https://api.hive.blog',
  'https://hive-api.arcange.eu',
  'https://api.openhive.network',
];

const HIVED_NODES = [
  // 'https://blocks.waivio.com',
  ...COMMON_RPC_NODES,
];

const HIVE_MIND_NODES = [
  // 'https://blocks.waivio.com:8082',
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

module.exports = {
  REFERRAL_TYPES,
  REFERRAL_STATUSES,
  HIVED_NODES,
  HIVE_MIND_NODES,
};
