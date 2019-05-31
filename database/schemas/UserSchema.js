const mongoose = require( 'mongoose' );
const Schema = mongoose.Schema;

const UserSchema = new Schema( {
    name: { type: String, index: true, unique: true },
    read_locales: { type: [ String ], default: [] },
    objects_follow: { type: [ String ], default: [] }, // arr of author_permlink of objects what user following
    users_follow: { type: [ String ], default: [] }, // arr of users which user follow
    json_metadata: { type: String, default: '' },
    app_settings: { type: Object, default: [] }, // custom settings like night_mode, default percent of vote etc.
    drafts: { type: [ Object ] }
}, { timestamps: true } );

const UserModel = mongoose.model( 'User', UserSchema );

module.exports = UserModel;
