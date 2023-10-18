const mongoose = require('mongoose');

const { Schema } = mongoose;

const ThreadSchema = new Schema({
  author: { type: String, required: true },
  permlink: { type: String, required: true },
  parent_author: { type: String, required: true },
  parent_permlink: { type: String, required: true },
  hashtags: { type: [String], index: true },
  replies: { type: [String], index: true },
  net_rshares: { type: Number, index: true },
  children: { type: Number, default: 0 },
  depth: { type: Number },
  app: { type: String },
  json_metadata: { type: String },
  title: { type: String },
  body: { type: String },
  category: { type: String },
  last_payout: { type: String },
  cashout_time: { type: String },
  pending_payout_value: { type: String },
  total_payout_value: { type: String },
  curator_payout_value: { type: String },
  max_accepted_payout: { type: String },
  created: { type: String },
  last_update: { type: String },
  percent_hbd: { type: Number },
}, { versionKey: false, timestamps: true });

const ThreadModel = mongoose.model('thread', ThreadSchema);

module.exports = ThreadModel;
