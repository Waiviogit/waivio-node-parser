const mongoose = require('mongoose');

const { Schema } = mongoose;

const SubscribeNotificationsSchema = new Schema({
  follower: { type: String, required: true },
  following: { type: String, required: true },
}, { versionKey: false });

SubscribeNotificationsSchema.index({ following: 1, follower: 1 }, { unique: true });

const SubscribeNotificationsModel = mongoose.model('SubscribeNotifications', SubscribeNotificationsSchema);

module.exports = SubscribeNotificationsModel;
