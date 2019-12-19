const { postRefsClient, lastBlockClient } = require( './redis' );
const { COMMENT_REF_TYPES } = require( '../constants' );

const PARSE_ONLY_VOTES = process.env.PARSE_ONLY_VOTES === 'true';

/**
 * Set ref to post to redis
 * @param path {String} author and permlink joined with underline
 * @param wobjects {String} Stringified array of wobjects on post
 * @param guest_author {String} If post was written from guest user, put here his name
 * @returns {Promise<void>}
 */
const addPostWithWobj = async function ( path, wobjects, guest_author ) {
    let wobjectsStr = typeof wobjects === 'string' ? wobjects : JSON.stringify( wobjects );
    await postRefsClient.hsetAsync( path, 'type', COMMENT_REF_TYPES.postWithWobjects );
    await postRefsClient.hsetAsync( path, 'wobjects', wobjectsStr );
    if( guest_author ) await postRefsClient.hsetAsync( path, 'guest_author', guest_author );
};

/**
 * Set ref to create wobj comment to redis
 * @param path {String} author and permlink joined with underline
 * @param root_wobj {String} author_permlink of wobject (actually permlink of comment)
 * @returns {Promise<void>}
 */
const addWobjRef = async function ( path, root_wobj ) {
    await postRefsClient.hsetAsync( path, 'type', COMMENT_REF_TYPES.createWobj );
    await postRefsClient.hsetAsync( path, 'root_wobj', root_wobj ); // root_wobj is author_permlink of wobject(just permlink)
};

/**
 * Set ref to comment with append on wobj to redis
 * @param path {String} author and permlink joined with underline
 * @param root_wobj {String} author_permlink of parent "Wobject"
 * @returns {Promise<void>}
 */
const addAppendWobj = async function ( path, root_wobj ) {
    await postRefsClient.hsetAsync( path, 'type', COMMENT_REF_TYPES.appendWobj ); // author_permlink is 'author' + '_' + 'permlink' of comment with appendWobject
    await postRefsClient.hsetAsync( path, 'root_wobj', root_wobj ); // root_wobj is author_permlink of wobject
};

/**
 * Set ref to comment with create Object Type redis
 * @param path {String} author and permlink joined with underline
 * @param name {String} "name" of created Object Type
 * @returns {Promise<void>}
 */
const addObjectType = async function ( path, name ) {
    await postRefsClient.hsetAsync( path, 'type', COMMENT_REF_TYPES.wobjType );
    await postRefsClient.hsetAsync( path, 'name', name );
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
