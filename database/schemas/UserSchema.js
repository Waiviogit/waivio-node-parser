const mongoose = require( 'mongoose' );
const Schema = mongoose.Schema;

const UserSchema = new Schema( {
    name: { type: String, index: true, unique: true },
    alias: { type: String },
    read_locales: { type: [ String ], default: [] },
    objects_follow: { type: [ String ], default: [] }, // arr of author_permlink of objects what user following
    users_follow: { type: [ String ], default: [] }, // arr of users which user follow
    json_metadata: { type: String, default: '' },
    app_settings: { type: Object, default: [] }, // custom settings like night_mode, default percent of vote etc.
    count_posts: { type: Number, default: 0, index: true },
    wobjects_weight: { type: Number, default: 0 } // sum of weight in all wobjects
}, { timestamps: true } );

const UserModel = mongoose.model( 'User', UserSchema );

module.exports = UserModel;
