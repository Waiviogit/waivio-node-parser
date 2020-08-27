const types = ['reviews'];
const campaignsStatuses = ['pending', 'active', 'inactive', 'expired', 'deleted', 'payed', 'reachedLimit', 'onHold', 'suspended'];
const reservationStatuses = ['assigned', 'unassigned', 'completed', 'rejected', 'expired'];

const PAYMENT_HISTORIES_TYPES = {
  REVIEW: 'review',
  TRANSFER: 'transfer',
  CAMPAIGN_SERVER_FEE: 'campaign_server_fee',
  REFERRAL_SERVER_FEE: 'referral_server_fee',
  BENEFICIARY_FEE: 'beneficiary_fee',
  INDEX_FEE: 'index_fee',
  DEMO_POST: 'demo_post',
  DEMO_USER_TRANSFER: 'demo_user_transfer',
  DEMO_DEBT: 'demo_debt',
  USER_TO_GUEST_TRANSFER: 'user_to_guest_transfer',
  COMPENSATION_FEE: 'compensation_fee',
  OVERPAYMENT_REFUND: 'overpayment_refund',
};

const REVIEW_DEBTS_TYPES = [
  PAYMENT_HISTORIES_TYPES.BENEFICIARY_FEE,
  PAYMENT_HISTORIES_TYPES.CAMPAIGN_SERVER_FEE,
  PAYMENT_HISTORIES_TYPES.COMPENSATION_FEE,
  PAYMENT_HISTORIES_TYPES.REVIEW,
  PAYMENT_HISTORIES_TYPES.INDEX_FEE,
];

module.exports = {
  REVIEW_DEBTS_TYPES,
  PAYMENT_HISTORIES_TYPES,
  reservationStatuses,
  types,
  campaignsStatuses,
};
