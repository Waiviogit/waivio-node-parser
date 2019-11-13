const { CommentRef } = require( '../../models' );
const { redisGetter, redisSetter } = require( '../redis' );
const { COMMENT_REF_TYPES } = require( '../constants' );
const _ = require( 'lodash' );

/**
 * Method to get comment reference value(wobject, append, post, object_type).
 * Method get data from redis(cached data), or mongo(stable),
 * if data not found in redis but was found in mongo => upload to redis cache
 * @param comment_path {String} path to STEEM comment (author + under line + permlink, e.x. social_my-first-post)
 * @returns {Promise<{Object}>} Return specified data about type of current comment and data about current entity
 */
exports.getCommentRef = async ( comment_path ) => {
    const redisResult = await redisGetter.getHashAll( comment_path );
    if( redisResult ) return redisResult;

    const mongoResult = await CommentRef.getRef( comment_path );
    if( _.get( mongoResult, 'error' ) ) {
        console.error( error );
    } else if ( _.get( mongoResult, 'commentRef.type' ) ) {
        switch ( mongoResult.commentRef.type ) {
            case COMMENT_REF_TYPES.postWithWobjects :
                await redisSetter.addPostWithWobj( comment_path, _.get( mongoResult, 'commentRef.wobjects' ) );
                break;
            case COMMENT_REF_TYPES.createWobj :
                await redisSetter.addWobjRef( comment_path, _.get( mongoResult, 'commentRef.root_wobj' ) );
                break;
            case COMMENT_REF_TYPES.appendWobj :
                await redisSetter.addAppendWobj( comment_path, _.get( mongoResult, 'commentRef.root_wobj' ) );
                break;
            case COMMENT_REF_TYPES.wobjType :
                await redisSetter.addObjectType( comment_path, _.get( mongoResult, 'commentPath.name' ) );
                break;
        }
        return mongoResult.commentRef;
    }
};
