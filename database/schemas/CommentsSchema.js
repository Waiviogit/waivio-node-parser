const mongoose = require( 'mongoose' );
const Schema = mongoose.Schema;

const CommentsSchema = new Schema( {
    author: { type: String, required: true },
    permlink: { type: String, required: true },
    root_author: { type: String, required: true },
    root_permlink: { type: String, required: true },
    parent_author: { type: String, required: true },
    parent_permlink: { type: String, required: true },
    active_votes: {
        type: [ {
            voter: { type: String },
            weight: { type: Number },
            percent: { type: Number }
        } ],
        default: []
    },
    guestInfo: {
        type: { userId: String, social: String },
        default: null
    }
}, { timestamps: false } );

CommentsSchema.index( { author: 1, permlink: 1 }, { unique: true } );
CommentsSchema.index( { root_author: 1, root_permlink: 1 } );
CommentsSchema.index( { parent_author: 1, parent_permlink: 1 } );
CommentsSchema.index( { 'guestInfo.userId': 1 } );

const CommentsModel = mongoose.model( 'Comments', CommentsSchema );

module.exports = CommentsModel;
