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
  WOBJ_RATING_GUEST: 'waivio_guest_wobj_rating',
  FOLLOW: 'follow',
  BELL_NOTIFICATIONS: 'bell_notifications',
  WAIVIO_GUEST_UPDATE: 'waivio_guest_update',
  WAIVIO_GUEST_VOTE: 'waivio_guest_vote',
  WAIVIO_GUEST_FOLLOW: 'waivio_guest_follow',
  WAIVIO_GUEST_FOLLOW_WOBJECT: 'waivio_guest_follow_wobject',
  WAIVIO_GUEST_REBLOG: 'waivio_guest_reblog',
  WAIVIO_GUEST_ACCOUNT_UPDATE: 'waivio_guest_account_update',
  WAIVIO_GUEST_BELL: 'waivio_guest_bell',
  WEBSITE_REMOVE_AUTHORITIES: 'website_remove_authorities',
  WEBSITE_ADD_AUTHORITIES: 'website_add_authorities',
  WEBSITE_REMOVE_ADMINISTRATORS: 'website_remove_administrators',
  WEBSITE_ADD_ADMINISTRATORS: 'website_add_administrators',
  WEBSITE_REMOVE_MODERATORS: 'website_remove_moderators',
  WEBSITE_ADD_MODERATORS: 'website_add_moderators',
  CUSTOM_WEBSITE_SETTINGS: 'custom_website_settings',
  CREATE_CUSTOM_WEBSITE: 'create_custom_website',
  DELETE_CUSTOM_WEBSITE: 'delete_custom_website',
  ACTIVATE_CUSTOM_WEBSITE: 'active_custom_website',
  SUSPEND_CUSTOM_WEBSITE: 'suspend_custom_website',
  WEBSITE_REFUND_REQUEST: 'website_refund_request',
  CREATE_WEBSITE_INVOICE: 'create_website_invoice',
  VOTE_APPEND: 'vote_append_object',
  HIDE_POST: 'hide_post',
  HIDE_COMMENT: 'hide_comment',
  GUEST_HIDE_POST: 'waivio_guest_hide_post',
  GUEST_HIDE_COMMENT: 'waivio_guest_hide_comment',
};

exports.BELL_NOTIFICATIONS = {
  USER: 'bell_notifications',
  WOBJECT: 'bell_wobject',
};

exports.VOTE_TYPES = {
  APPEND_WOBJ: 'append_wobj',
  POST_WITH_WOBJ: 'post_with_wobj',
};

exports.HIDE_ACTION = {
  HIDE: 'hide',
  UNHIDE: 'unhide',
};

exports.MUTE_ACTION = {
  MUTE: 'mute',
  UNMUTE: 'unmute',
};

exports.REQUIRED_AUTHS = 'required_auths[0]';
exports.REQUIRED_POSTING_AUTHS = 'required_posting_auths[0]';
