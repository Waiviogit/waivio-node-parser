const mongoose = require('mongoose');

const { Schema } = mongoose;

const WalletSchema = new Schema({
  account: { type: String, required: true },
  trxId: { type: String, required: true },
  type: {
    type: String,
    required: true,
    enum: ['transfer', 'transfer_to_vesting',
      'claim_reward_balance', 'comment_benefactor_reward', 'fill_convert_request', 'transfer_to_savings',
      'transfer_from_savings'],
  },
  receiver: { type: String },
  reward_sbd: { type: String },
  request_id: { type: String },
  reward_steem: { type: String },
  amount: { type: String },
  memo: { type: String },
  reward_vests: { type: String },
  timestamp: { type: Number, default: Math.round(new Date() / 1000) },
  to: { type: String },
}, { timestamps: false });

WalletSchema.index({ account: 1 });

const Wallet = mongoose.model('wallet', WalletSchema);

module.exports = Wallet;
