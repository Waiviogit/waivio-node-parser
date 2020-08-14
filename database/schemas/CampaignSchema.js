const mongoose = require('mongoose');
const Float = require('mongoose-float').loadType(mongoose, 4);
const { types, campaignsStatuses, reservationStatuses } = require('constants/campaigns');
const config = require('config');
const _ = require('lodash');

const { Schema } = mongoose;

const userSchema = new Schema({
  name: { type: String, required: true },
  object_permlink: { type: String, required: true },
  permlink: { type: String, required: true, index: true },
  referral_server: { type: String },
  unreservation_permlink: { type: String },
  rootName: { type: String },
  children: { type: Number, default: 0 },
  rise_reward_permlink: { type: String },
  rewardRaisedBy: { type: Number, default: 0 },
  reduce_reward_permlink: { type: String },
  rewardReducedBy: { type: Number, default: 0 },
  rejection_permlink: { type: String },
  hiveCurrency: { type: Number, required: true },
  status: {
    type: String, enum: reservationStatuses, required: true, default: 'assigned', index: true,
  },
  completedAt: { type: Date },
}, {
  timestamps: true,
});

const paymentSchema = new Schema({
  userName: { type: String, required: true },
  objectPermlink: { type: String, required: true },
  rootAuthor: { type: String, required: true },
  paymentPermlink: { type: String },
  rejectionPermlink: { type: String },
  postTitle: { type: String, required: true },
  postPermlink: { type: String, required: true },
  app: { type: String },
  status: { type: String, enum: ['active', 'rejected', 'payed'], default: 'active' },
}, {
  timestamps: true,
});

const campaignSchema = new Schema({
  guideName: { type: String, required: true, index: true },
  name: {
    type: String, required: true, maxlength: 256, index: true,
  },
  description: { type: String, maxlength: 512 },
  type: { type: String, enum: types, required: true },
  status: { type: String, enum: campaignsStatuses, default: 'pending' },
  note: { type: String, maxlength: 256 },
  compensationAccount: { type: String },
  campaign_server: { type: String, default: config.app },
  budget: {
    type: Float, required: true, min: 0.001, max: 10000,
  },
  reward: {
    type: Float, required: true, min: 0.001, max: 500,
  },
  count_reservation_days: { type: Number, default: 1 },
  agreementObjects: { type: [String] },
  usersLegalNotice: { type: String, maxlength: 2000 },
  commissionAgreement: {
    type: Number, min: 0.05, max: 1, default: 0.05,
  },
  requirements: {
    minPhotos: { type: Number, required: true },
    receiptPhoto: { type: Boolean, default: false },
  },
  userRequirements: {
    minPosts: { type: Number, default: 0 },
    minFollowers: { type: Number, default: 0 },
    minExpertise: { type: Number, default: 0 },
  },
  map: {
    type: {
      type: String,
      enum: ['Point'],
    },
    coordinates: {
      type: [Number], // First element - longitude(-180..180), second element - latitude(-90..90)
    }, // [longitude, latitude]
  },
  requiredObject: { type: String, required: true },
  objects: { type: [String], validate: /\S+/, required: true },
  users: [userSchema],
  blacklist_users: [String],
  whitelist_users: [String],
  activation_permlink: { type: String, index: true },
  deactivation_permlink: { type: String },
  match_bots: [{ type: String }],
  frequency_assign: { type: Number, max: 300, default: 0 },
  payments: [paymentSchema],
  reservation_timetable: {
    monday: { type: Boolean, default: true },
    tuesday: { type: Boolean, default: true },
    wednesday: { type: Boolean, default: true },
    thursday: { type: Boolean, default: true },
    friday: { type: Boolean, default: true },
    saturday: { type: Boolean, default: true },
    sunday: { type: Boolean, default: true },
  },
  app: { type: String, default: null },
  expired_at: { type: Date },
},
{
  timestamps: true,
});

campaignSchema.index({ map: '2dsphere' });
campaignSchema.index({ createdAt: -1 });
campaignSchema.index({ reward: -1 });
paymentSchema.index({ userName: 1, postPermlink: 1 });

campaignSchema.virtual('canAssign')
  .get(function () {
    const countAssigns = parseInt(this.budget / this.reward, 10);
    const filterUsers = _.filter(this.users, (user) => ['assigned', 'completed'].includes(user.status) && new Date(user.createdAt).getMonth() === new Date().getMonth());

    return countAssigns > filterUsers.length;
  });

campaignSchema.pre('save', function (next) {
  if (this.reward > this.budget) {
    const error = new Error('Reward more than budget');

    return next(error);
  }
  if (this.map && (!this.map.type || this.map.coordinates === [])) this.map = undefined;
  next();
});

const CampaignModel = mongoose.model('Campaign', campaignSchema);

module.exports = CampaignModel;
