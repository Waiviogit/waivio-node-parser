const { CommentRef } = require( '../database' ).models;
const { COMMENT_REF_TYPES } = require( '../utilities/constants' );

const create = async ( data ) => {
    const newCommentRef = new CommentRef( data );
    try {
        return { commentRef: await newCommentRef.save() };
    } catch ( error ) {
        return { error };
    }
};

exports.addPostRef = async ( { comment_path, wobjects } ) => {
    return await create( {
        comment_path, wobjects, type: COMMENT_REF_TYPES.postWithWobjects
    } );
};
exports.addWobjRef = async ( { comment_path, root_wobj } ) => {
    return await create( {
        comment_path, root_wobj, type: COMMENT_REF_TYPES.createWobj
    } );
};
exports.addAppendRef = async ( { comment_path, root_wobj } ) => {
    return await create( {
        comment_path, root_wobj, type: COMMENT_REF_TYPES.appendWobj
    } );
};
exports.addWobjTypeRef = async ( { comment_path, name } ) => {
    return await create( {
        comment_path, name, type: COMMENT_REF_TYPES.wobjType } );
};

exports.getRef = async ( comment_path ) => {
    try {
        const commentRef = await CommentRef.findOne( { comment_path } ).lean();
        return{ commentRef };
    } catch ( error ) {
        return { error };
    }
};

exports.create = create;
