exports.STATUSES = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  SUSPENDED: 'suspended',
};

exports.TRANSFER_ID = 'websitesPayment';
exports.REFUND_ID = 'websitesRefund';

exports.FEE = {
  minimumValue: 1,
  currency: 'HBD',
  perUser: 0.005,
  account: 'waivio.hosting',
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