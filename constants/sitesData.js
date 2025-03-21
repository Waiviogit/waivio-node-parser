const config = require('config');

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
  CREDIT: 'credit', // special type admin can give credits to site
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

exports.CAN_MUTE_GLOBAL = config.canMuteGlobal;

exports.SOCIAL_HOSTS = ['social.gifts', 'socialgifts.pp.ua'];

exports.SHOP_SETTINGS_TYPE = {
  USER: 'user',
  OBJECT: 'object',
};

exports.DEFAULT_BENEFICIARY = 'waivio';
exports.DEFAULT_REFERRAL = 'waivio.referrals';

exports.MAX_DEBT_PER_SITE = 20;

exports.BILLING_TYPE = {
  CRYPTO: 'crypto',
  PAYPAL_SUBSCRIPTION: 'paypal_subscription',
};
