exports.STATUSES = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  SUSPENDED: 'suspended',
};

exports.CAN_DELETE_STATUSES = [
  this.STATUSES.INACTIVE,
  this.STATUSES.PENDING,
  this.STATUSES.SUSPENDED,
];

exports.TRANSFER_ID = 'websitesPayment';
exports.REFUND_ID = 'websitesRefund';

exports.FEE = {
  minimumValue: 1,
  currency: 'HBD',
  perUser: 0.005,
  account: 'waivio.web',
  id: JSON.stringify({ id: this.TRANSFER_ID }),
};

exports.PAYMENT_TYPES = {
  TRANSFER: 'transfer',
  WRITE_OFF: 'writeOff',
  REFUND: 'refund',
};

exports.REFUND_TYPES = {
  WEBSITE_REFUND: 'website_refund',
};

exports.REFUND_STATUSES = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  REJECTED: 'rejected',
  FROZEN: 'frozen',
};

exports.SUPPORTED_COLORS = {
  BACKGROUND: 'background',
  FONT: 'font',
  HOVER: 'hover',
  HEADER: 'header',
  BUTTON: 'button',
  BORDER: 'border',
  FOCUS: 'focus',
  LINKS: 'links',
};

exports.PARSE_MATCHING = {
  [this.TRANSFER_ID]: this.PAYMENT_TYPES.TRANSFER,
  [this.REFUND_ID]: this.PAYMENT_TYPES.REFUND,
};

exports.PATH = {
  REFERRAL_ACCOUNT: 'app_commissions.referral_commission_acc',
};

exports.CAN_MUTE_GLOBAL = process.env.CAN_MUTE_GLOBAL
  ? process.env.CAN_MUTE_GLOBAL.split(',')
  : [];

exports.WAIVIO_REWARDS_TYPES = {
  STOP_CAMPAIGN: 'waivio_stop_campaign',
  ASSIGN_CAMPAIGN: 'waivio_assign_campaign',
  ACTIVATE_CAMPAIGN: 'waivio_activate_campaign',
  RAISE_REVIEW_REWARD: 'waivio_raise_review_reward',
  REDUCE_REVIEW_REWARD: 'waivio_reduce_review_reward',
  REJECT_OBJECT_CAMPAIGN: 'waivio_reject_object_campaign',
  REJECT_RESERVATION_BY_GUIDE: 'reject_reservation_by_guide',
  RESTORE_RESERVATION_BY_GUIDE: 'restore_reservation_by_guide',
};
