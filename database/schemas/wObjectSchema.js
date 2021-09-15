const mongoose = require('mongoose');

const { Schema } = mongoose;

const AuthoritySchema = new Schema({
  administrative: { type: [String], default: [] },
  ownership: { type: [String], default: [] },
}, { _id: false });

const SearchSchema = new Schema({
  name: { type: [String], default: [] },
  email: { type: [String], default: [] },
  phone: { type: [String], default: [] },
  address: { type: [String], default: [] },
  author_permlink: { type: [String], default: [] },
  description: { type: [String], default: [] },
  title: { type: [String], default: [] },
  categoryItem: { type: [String], default: [] },
}, { _id: false });

const WObjectSchema = new Schema({
  app: String,
  community: String,
  object_type: { type: String, required: true },
  default_name: { type: String, required: true },
  is_posting_open: { type: Boolean, default: true },
  is_extending_open: { type: Boolean, default: true },
  creator: { type: String, required: true },
  author: { type: String, required: true },
  author_permlink: {
    type: String, index: true, unique: true, required: true,
  }, // unique identity for wobject, link to create object POST
  // value in STEEM(or WVIO) as a summ of rewards, index for quick sort
  weight: { type: Number, index: true, default: 0 },
  count_posts: { type: Number, default: 0 },
  parent: { type: String, default: '' },
  children: { type: [String], default: [] },
  authority: { type: AuthoritySchema, default: () => ({}) },
  fields: [{
    name: { type: String, index: true },
    body: { type: String },
    weight: { type: Number, default: 1 },
    locale: { type: String, default: 'en-US' },
    tagCategory: { type: String },
    creator: { type: String },
    author: String,
    // author+permlink is link to appendObject COMMENT(or to create object post if it's first field)
    permlink: String,
    id: String,
    active_votes: {
      type: [{
        voter: { type: String },
        weight: { type: Number },
      }],
      default: [],
    },
  }],
  map: {
    type: {
      type: String, // Don't do `{ location: { type: String } }`
      enum: ['Point'], // 'location.type' must be 'Point'
    },
    coordinates: {
      type: [Number], // First element - longitude(-180..180), second element - latitude(-90..90)
    }, // [longitude, latitude]
  },
  latest_posts: { type: [mongoose.Schema.ObjectId], default: [] },
  // always keep last N posts to quick build wobject feed
  last_posts_count: { type: Number, default: 0 },
  activeCampaigns: { type: [mongoose.Types.ObjectId], default: [] },
  activeCampaignsCount: { type: Number, default: 0 },
  search: { type: SearchSchema, default: () => ({}) },
},
{
  strict: false,
  toObject: {
    virtuals: true,
  },
  timestamps: true,
});

// eslint-disable-next-line func-names
WObjectSchema.pre('save', function (next) {
  if (this.map && !this.map.type) {
    this.map = null;
  }
  next();
});

WObjectSchema.index({ map: '2dsphere' });
WObjectSchema.index({ parent: -1 });
SearchSchema.index({ author_permlink: 1 });
SearchSchema.index({ name: 1 });
SearchSchema.index({ email: 1 });
SearchSchema.index({ phone: 1 });
SearchSchema.index({ address: 1 });
SearchSchema.index({ description: 1 });
SearchSchema.index({ title: 1 });
SearchSchema.index({ categoryItem: 1 });

const wObjectModel = mongoose.model('wobject', WObjectSchema);

module.exports = wObjectModel;
