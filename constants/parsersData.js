exports.MAIN_OPS = {
  COMMENT: 'comment',
  CUSTOM_JSON: 'custom_json',
  ACCOUNT_UPDATE: 'account_update',
  ACCOUNT_UPDATE2: 'account_update2',
  CREATE_CLAIMED_ACCOUNT: 'create_claimed_account',
  ACCOUNT_CREATE: 'account_create',
  VOTE: 'vote',
  ACCOUNT_WITNES_VOTE: 'account_witness_vote',
  TRANSFER: 'transfer',
  WITHDRAW_VESTING: 'withdraw_vesting',
  SET_WITHDRAW_VESTING_ROUTE: 'set_withdraw_vesting_route',
  TRANSFER_TO_VESTING: 'transfer_to_vesting',
  CHANGE_RECOVERY_ACCOUNT: 'change_recovery_account',
  TRANSFER_FROM_SAVINGS: 'transfer_from_savings',
  CLAIM_REWARD_BALANCE: 'claim_reward_balance',
};

exports.CUSTOM_JSON_OPS = {
  REJECT_REFERRAL_LICENCE: 'reject_referral_license',
  CONFIRM_REFERRAL_LICENCE: 'confirm_referral_license',
  ADD_REFERRAL_AGENT: 'add_referral_agent',
  FOLLOW_WOBJECT: 'follow_wobject',
  WOBJ_RATING: 'wobj_rating',
  FOLLOW: 'follow',
  BELL_NOTIFICATIONS: 'bell_notifications',
  WAIVIO_GUEST_UPDATE: 'waivio_guest_update',
  WAIVIO_GUEST_VOTE: 'waivio_guest_vote',
  WAIVIO_GUEST_FOLLOW: 'waivio_guest_follow',
  WAIVIO_GUEST_FOLLOW_WOBJECT: 'waivio_guest_follow_wobject',
  WAIVIO_GUEST_REBLOG: 'waivio_guest_reblog',
  WAIVIO_GUEST_ACCOUNT_UPDATE: 'waivio_guest_account_update',
  WAIVIO_GUEST_BELL: 'waivio_guest_bell',
};

exports.BELL_NOTIFICATIONS = {
  USER: 'bell_notifications',
  WOBJECT: 'bell_wobject',
};
