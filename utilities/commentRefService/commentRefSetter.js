const { CommentRef } = require( '../../models' );
const { redisSetter } = require( '../redis' );
const { COMMENT_REF_TYPES } = require( '../constants' );
const { isRefWithCorrectType } = require( './commentRefValidator' );
const _ = require( 'lodash' );

exports.addAppendWobj = async ( comment_path, root_wobj ) => {
    if( !( await isRefWithCorrectType( comment_path, COMMENT_REF_TYPES.appendWobj ) ) )
        return console.error( `Exists comment ref, "${comment_path}" already exists with another "type"!` );
    const mongoRes = await CommentRef.addAppendRef( { comment_path, root_wobj } );
    const redisRes = await redisSetter.addAppendWobj( comment_path, root_wobj );
    if( _.get( mongoRes, 'error' ) || _.get( redisRes, 'error' ) ) {
        console.error( mongoRes.error || redisRes.error );
    }
};

exports.addWobjRef = async ( comment_path, root_wobj ) => {
    if( !( await isRefWithCorrectType( comment_path, COMMENT_REF_TYPES.createWobj ) ) )
        return console.error( `Exists comment ref, "${comment_path}" already exists with another "type"!` );
    const mongoRes = await CommentRef.addWobjRef( { comment_path, root_wobj } );
    const redisRes = await redisSetter.addWobjRef( comment_path, root_wobj );
    if( _.get( mongoRes, 'error' ) || _.get( redisRes, 'error' ) ) {
        console.error( mongoRes.error || redisRes.error );
    }
};

exports.addWobjTypeRef = async ( comment_path, name ) => {
    if( !( await isRefWithCorrectType( comment_path, COMMENT_REF_TYPES.wobjType ) ) )
        return console.error( `Exists comment ref, "${comment_path}" already exists with another "type"!` );
    const mongoRes = await CommentRef.addWobjTypeRef( { comment_path, name } );
    const redisRes = await redisSetter.addObjectType( comment_path, name );
    if( _.get( mongoRes, 'error' ) || _.get( redisRes, 'error' ) ) {
        console.error( mongoRes.error || redisRes.error );
    }
};

exports.addPostRef = async ( comment_path, wobjects, guest_author ) => {
    if( !( await isRefWithCorrectType( comment_path, COMMENT_REF_TYPES.postWithWobjects ) ) )
        return console.error( `Exists comment ref, "${comment_path}" already exists with another "type"!` );
    const mongoRes = await CommentRef.addPostRef( { comment_path, wobjects: JSON.stringify( wobjects ), guest_author } );
    const redisRes = await redisSetter.addPostWithWobj( comment_path, wobjects, guest_author );
    if( _.get( mongoRes, 'error' ) || _.get( redisRes, 'error' ) ) {
        console.error( mongoRes.error || redisRes.error );
    }
};
