const { postRefsClient, lastBlockClient } = require( './redis' );
const { COMMENT_REF_TYPES } = require( '../constants' );

const PARSE_ONLY_VOTES = process.env.PARSE_ONLY_VOTES === 'true';

const addPostWithWobj = async function ( author_permlink, wobjects ) {
    await postRefsClient.hsetAsync( author_permlink, 'type', COMMENT_REF_TYPES.postWithWobjects );
    await postRefsClient.hsetAsync( author_permlink, 'wobjects', JSON.stringify( wobjects ) );
};

const addWobjRef = async function ( path, root_wobj ) {
    await postRefsClient.hsetAsync( path, 'type', COMMENT_REF_TYPES.createWobj );
    await postRefsClient.hsetAsync( path, 'root_wobj', root_wobj ); // root_wobj is author_permlink of wobject(just permlink)
};

const addAppendWobj = async function ( author_permlink, root_wobj ) {
    await postRefsClient.hsetAsync( author_permlink, 'type', COMMENT_REF_TYPES.appendWobj ); // author_permlink is 'author' + '_' + 'permlink' of comment with appendWobject
    await postRefsClient.hsetAsync( author_permlink, 'root_wobj', root_wobj ); // root_wobj is author_permlink of wobject
};

const addObjectType = async function ( author_permlink, name ) {
    await postRefsClient.hsetAsync( author_permlink, 'type', COMMENT_REF_TYPES.wobjType );
    await postRefsClient.hsetAsync( author_permlink, 'name', name );
};

const setLastBlockNum = async function ( blockNum ) {
    if ( blockNum ) {
        const key = PARSE_ONLY_VOTES ? 'last_vote_block_num' : 'last_block_num';

        await lastBlockClient.setAsync( key, blockNum );
    }
};

module.exports = {
    addPostWithWobj,
    addAppendWobj,
    setLastBlockNum,
    addWobjRef,
    addObjectType
};
