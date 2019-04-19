const mongoose = require( 'mongoose' );
const Schema = mongoose.Schema;

const UserSchema = new Schema( {
    name: { type: String, index: true, unique: true },
    profile_image: { type: String },
    read_locales: { type: [ String ], default: [] },
    objects_follow: { type: [ String ], default: [] } // arr of author_permlink of objects what user following
}, { timestamps: true } );

const UserModel = mongoose.model( 'User', UserSchema );

module.exports = UserModel;
