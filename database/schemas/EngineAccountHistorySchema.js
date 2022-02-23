const mongoose = require('mongoose');

const { Schema } = mongoose;

const EngineAccountHistorySchema = new Schema({
  refHiveBlockNumber: { type: Number },
  blockNumber: { type: Number },
  account: { type: String },
  transactionId: { type: String },
  operation: { type: String },
  symbolOut: { type: String },
  symbolOutQuantity: { type: String },
  symbolIn: { type: String },
  symbolInQuantity: { type: String },
  timestamp: { type: Number },
  quantity: { type: String },
  symbol: { type: String },
  tokenState: { type: String },
  authorperm: { type: String },
  rewardPoolId: { type: Number },
  destination: { type: String },
  depositAccount: { type: String },
  pair: { type: String },
  address: { type: String },
  memo: { type: String },
  ex_rate: { type: Number },
});

EngineAccountHistorySchema.index({ account: 1 });
EngineAccountHistorySchema.index({ timestamp: -1 });
EngineAccountHistorySchema.index({ symbol: 1, symbolOut: 1, symbolIn: 1 });
EngineAccountHistorySchema.index({ operation: 1, transactionId: 1, account: 1 }, { unique: true });

const EngineAccountHistoryModel = mongoose.model('engine_account_histories', EngineAccountHistorySchema);

module.exports = EngineAccountHistoryModel;
