const { Comment } = require( '../database' ).models;
const UserModel = require( './UserModel' );

exports.create = async function ( comment ) {
    await UserModel.checkAndCreate( comment.author ); // create user in DB if it doesn't exist

    const newComment = new Comment( comment );

    try {
        return { comment: await newComment.save() };
    } catch ( error ) {
        return { error };
    }
};
