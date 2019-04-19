const mongoose = require( 'mongoose' );
const Schema = mongoose.Schema;

const UserWobjectsSchema = new Schema( {
    user_name: { type: String, require: true },
    author_permlink: { type: String, require: true },
    weight: { type: Number, default: 0 }
}, { timestamps: false } );

UserWobjectsSchema.index( { user_name: 1 } );
UserWobjectsSchema.index( { author_permlink: 1 } );
UserWobjectsSchema.index( { author_permlink: 1, user_name: 1 }, { unique: true } );


const UserWobjects = mongoose.model( 'user_wobjects', UserWobjectsSchema );

module.exports = UserWobjects;
