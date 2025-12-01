const mongoose = require('mongoose');

const { Schema } = mongoose;

const WObjectPendingUpdateSchema = new Schema({
  name: { type: String },
  body: { type: String },
  locale: { type: String, default: 'en-US' },
  creator: { type: String },
  author: { type: String },
  permlink: { type: String },
  id: { type: String },
  authorPermlink: { type: String },
  partNumber: { type: Number },
  totalParts: { type: Number },
}, { timestamps: true, versionKey: false });

WObjectPendingUpdateSchema.index(
  { id: 1, authorPermlink: 1, partNumber: 1 },
  { unique: true },
);

WObjectPendingUpdateSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 },
);

module.exports = mongoose.model('wobject_pending_updates', WObjectPendingUpdateSchema, 'wobject_pending_updates');
