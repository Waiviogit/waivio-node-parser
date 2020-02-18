const mongoose = require('mongoose');

const { Schema } = mongoose;

const botSchema = new Schema({
  name: { type: String, required: true },
  postingKey: { type: String, required: true },
  roles: { type: [String], required: true },
}, { _id: false });

const moderatorsSchema = new Schema({
  name: { type: String, required: true },
  author_permlinks: { type: [String], default: [] },
}, { _id: false });

const AppSchema = new Schema({
  name: { type: String, index: true, unique: true },
  admin: { type: String, index: true, required: true },
  moderators: {
    type: [moderatorsSchema],
  },
  supported_object_types: [{
    object_type: { type: String, index: true },
    required_fields: { type: [String], default: [] },

  }],
  supported_objects: { type: [String], index: true, default: [] },
  blacklists: {
    wobjects: { type: [], default: [] },
    posts: [{
      author: { type: String, required: true },
      permlink: { type: String, required: true },
    }],
    users: { type: [], default: [] },
    apps: { type: [], default: [] },
  },
  daily_chosen_post: {
    type: {
      author: { type: String },
      permlink: { type: String },
      title: { type: String },
    },
    default: null,
  },
  weekly_chosen_post: {
    type: {
      author: { type: String },
      permlink: { type: String },
      title: { type: String },
    },
    default: null,
  },
  black_list_users: { type: [String], default: [] },
  service_bots: { type: [botSchema], default: [] },
}, { timestamps: true });

const AppModel = mongoose.model('App', AppSchema);

module.exports = AppModel;
