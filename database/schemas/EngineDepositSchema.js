const mongoose = require('mongoose');

const { Schema } = mongoose;

const EngineDepositSchema = new Schema({
  userName: { type: String, required: true, index: true },
  from_coin: { type: String, required: true },
  to_coin: { type: String, required: true },
  destination: { type: String, required: true },
  pair: { type: String, required: true },
  address: { type: String },
  account: { type: String },
  memo: { type: String },
  ex_rate: { type: Number, required: true },
  blockNum: { type: Number, required: true },
}, { versionKey: false, timestamps: true });

const EngineDepositWithdrawModel = mongoose.model('engine_deposits', EngineDepositSchema);

module.exports = EngineDepositWithdrawModel;
