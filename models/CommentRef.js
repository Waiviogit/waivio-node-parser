const { CommentRef } = require( '../database' ).models;
const { COMMENT_REF_TYPES } = require( '../utilities/constants' );

const create = async ( data ) => {
    try {
        const commentRef = await CommentRef.findOneAndUpdate(
            { comment_path: data.comment_path },
            { ...data },
            { upsert: true, new: true }
        ).lean();
        return { commentRef };
    } catch ( error ) {
        return { error };
    }
};

exports.addPostRef = async ( { comment_path, wobjects, guest_author } ) => {
    const data = { comment_path, wobjects, type: COMMENT_REF_TYPES.postWithWobjects };
    if( guest_author ) data.guest_author = guest_author;
    return await create( data );
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

const isExist = async ( comment_path ) => {
    try {
        const count = await CommentRef.find( { comment_path } ).count();
        return!!count;
    } catch ( error ) {
        return false;
    }
};

exports.create = create;
