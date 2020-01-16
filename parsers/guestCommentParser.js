const { CommentModel } = require( '../models' );
const { guestHelpers } = require( '../utilities/guestOperations' );
const { postsUtil } = require( '../utilities/steemApi' );

exports.parse = async ( { operation, metadata } ) => {
    const guestInfo = guestHelpers.getFromMetadataGuestInfo( { operation, metadata } );
    if( !guestInfo ) return;

    const { post: comment, err } = await postsUtil.getPost( operation.author, operation.permlink );
    if( err || !comment ) {
        return console.error( err || `Comment @${operation.author}/${operation.permlink} not found!` );
    }

    const { error } = await CommentModel.createOrUpdate( { ...operation, guestInfo } );
    if( error ) return console.error( error );
};
