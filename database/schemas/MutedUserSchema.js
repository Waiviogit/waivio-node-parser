const _ = require('lodash');
const mongoose = require('mongoose');

const { Schema } = mongoose;

const MutedUserSchema = new Schema({
  userName: {
    type: String, required: true, index: true, unique: true,
  },
  mutedBy: { type: [String], required: true, default: [] },
  mutedForApps: {
    type: [String], required: true, default: [], index: true,
  },
}, { versionKey: false });

MutedUserSchema.post('findOneAndUpdate', async function (doc) {
  if (_.isEmpty(_.get(doc, 'mutedForApps'))) {
    await this.model.deleteOne({ userName: doc.userName });
  }
});

const MutedUserModel = mongoose.model('muted_user', MutedUserSchema);

module.exports = MutedUserModel;
