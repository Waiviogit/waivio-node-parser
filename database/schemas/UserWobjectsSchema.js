const mongoose = require('mongoose');

const { Schema } = mongoose;

const UserWobjectsSchema = new Schema({
  user_name: { type: String, require: true },
  author_permlink: { type: String, require: true },
  weight: { type: Number, default: 0 },
  expertiseWAIV: { type: Number },
}, { timestamps: false });

UserWobjectsSchema.index({ user_name: 1 });
UserWobjectsSchema.index({ author_permlink: 1 });
UserWobjectsSchema.index({ author_permlink: 1, user_name: 1 }, { unique: true });
UserWobjectsSchema.index({ author_permlink: 1, _id: 1 });

const UserWobjects = mongoose.model('user_wobjects', UserWobjectsSchema);

module.exports = UserWobjects;
