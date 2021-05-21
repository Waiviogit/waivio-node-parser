const mongoose = require('mongoose');

const { Schema } = mongoose;

const ObjectTypeSchema = new Schema({
  name: { type: String, required: true },
  author: { type: String, require: true },
  permlink: { type: String, require: true },
  weight: { type: Number, default: 0 }, // value in STEEM(or WVIO) as a sum of rewards, index for quick sort
  top_wobjects: { type: [String], default: [] },
  top_experts: {
    type: [{
      name: { type: String },
      weight: { type: Number, default: 0 },
    }],
    default: [],
  },
  updates_blacklist: { type: [String], default: [] },
  supposed_updates: {
    type: [{
      name: String, // name of supposed update(name, title, rating etc.)
      values: [], // list of supposed values (if need to add several updates by default)
      id_path: String, // if "id_path" null - do not add any "id" field
    }],
    default: [],
  },
  commentsNum: { type: Number, default: 0 },
  firstCreated: { type: Boolean, default: false },
},
{
  toObject: { virtuals: true }, timestamps: true,
});

ObjectTypeSchema.index({ author: 1, permlink: 1 }, { unique: true });
ObjectTypeSchema.index({ name: 1 }, { unique: true });

const ObjectTypeModel = mongoose.model('ObjectType', ObjectTypeSchema);

module.exports = ObjectTypeModel;
