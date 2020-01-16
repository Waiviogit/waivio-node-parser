const { Comment } = require( '../database' ).models;
const UserModel = require( './UserModel' );
const _ = require( 'lodash' );

exports.createOrUpdate = async function ( comment ) {
    await UserModel.checkAndCreate( comment.author ); // create user in DB if it doesn't exist
    try {
        return { comment: await Comment.findOneAndUpdate(
            { ..._.pick( comment, [ 'author', 'permlink' ] ) },
            { ...comment },
            { upsert: true, sedDefaultOnInsert: true } ) };
    } catch ( error ) {
        return { error };
    }
};
