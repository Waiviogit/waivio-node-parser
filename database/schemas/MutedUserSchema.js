const _ = require('lodash');
const mongoose = require('mongoose');

const { Schema } = mongoose;

const MutedUserSchema = new Schema({
  userName: { type: String, required: true },
  mutedBy: { type: String, required: true },
  mutedForApps: {
    type: [String], required: true, default: [], index: true,
  },
}, { versionKey: false });

MutedUserSchema.index({ userName: 1, mutedBy: 1 }, { unique: true });

MutedUserSchema.post('findOneAndUpdate', async function (doc) {
  if (_.isEmpty(_.get(doc, 'mutedForApps'))) {
    await this.model.deleteOne({ userName: doc.userName });
  }
});

const MutedUserModel = mongoose.model('muted_user', MutedUserSchema);

module.exports = MutedUserModel;
