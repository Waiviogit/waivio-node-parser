const mongoose = require('mongoose');

const { Schema } = mongoose;

const AirdropSchema = new Schema({
  name: { type: String },
  vesting_shares: { type: Number },
  tokenValue: { type: Number },
  tokenValueVesting: { type: Number },
  last_vote_time: { type: Date },
  last_post: { type: Date },
  last_root_post: { type: Date },
  notProcessed: { type: Boolean },
  expertiseWAIV: { type: Number },
});

const AirdropModel = mongoose.model('airdrop_waiv', AirdropSchema, 'airdrop_waiv');

module.exports = AirdropModel;
