const { Comment } = require( '../database' ).models;
const UserModel = require( './UserModel' );
const _ = require( 'lodash' );

exports.createOrUpdate = async function ( comment ) {
    await UserModel.checkAndCreate( comment.author ); // create user in DB if it doesn't exist
    try {
        const newComment = await Comment.findOneAndUpdate(
            { ..._.pick( comment, [ 'author', 'permlink' ] ) },
            { ...comment },
            { upsert: true, new: true, setDefaultOnInsert: true } );
        return { comment: newComment.toObject() };
    } catch ( error ) {
        return { error };
    }
};

exports.getOne = async ( { author, permlink } ) => {
    try {
        return { comment: await Comment.findOne( { author, permlink } ).lean() };
    } catch ( error ) {
        return { error };
    }
};

exports.addVote = async ( { author, permlink, voter, percent } ) => {
    try {
        await Comment.updateOne( { author, permlink }, { $pull: { active_votes: { voter } } } );
        return {
            result: await Comment.updateOne(
                { author, permlink },
                { $addToSet: { active_votes: { voter, percent } } }
            )
        };
    } catch ( error ) {
        return { error };
    }
};
