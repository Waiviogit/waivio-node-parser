const { CommentRef } = require( '../../models' );
const { redisGetter } = require( '../redis' );
const _ = require( 'lodash' );

const getCommentRef = async ( comment_path ) => {
    const redisResult = await redisGetter.getHashAll( comment_path );
    if( redisResult ) return redisResult;

    const mongoResult = await CommentRef.getRef( comment_path );
    if( _.get( mongoResult, 'error' ) ) {
        console.error( error );
        return;
    } else if ( _.get( mongoResult, 'commentRef' ) ) {
        // if "comment_ref" found in mongo collection and not found in redis => need to upload this ref to redis(as cache)
        console.log( mongoResult );
    }
};

( async () => {
    await getCommentRef( 'aaa_123' );
} )();
