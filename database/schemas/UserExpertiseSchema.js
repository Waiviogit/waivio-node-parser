const mongoose = require('mongoose');

const { Schema } = mongoose;

const UserExpertiseSchema = new Schema(
  {
    user_name: { type: String, required: true },
    author_permlink: { type: String, required: true },
    weight: { type: Number, default: 0 },
  },
  { timestamps: false, versionKey: false },
);

UserExpertiseSchema.index({ user_name: 1 });
UserExpertiseSchema.index({ author_permlink: 1, user_name: 1 }, { unique: true });
UserExpertiseSchema.index({ weight: -1 });
UserExpertiseSchema.index({ author_permlink: 1, _id: 1 });

const UserExpertise = mongoose.model('user_expertise', UserExpertiseSchema);

module.exports = UserExpertise;
