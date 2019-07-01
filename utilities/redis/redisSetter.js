const { postRefsClient, lastBlockClient } = require( './redis' );

const addPostWithWobj = async function ( author_permlink, wobjects ) {
    await postRefsClient.hsetAsync( author_permlink, 'type', 'post_with_wobj' );
    await postRefsClient.hsetAsync( author_permlink, 'wobjects', JSON.stringify( wobjects ) );
};

const addWobjRef = async function ( author, author_permlink ) {
    await postRefsClient.hsetAsync( `${author }_${ author_permlink}`, 'type', 'create_wobj' );
    await postRefsClient.hsetAsync( `${author }_${ author_permlink}`, 'root_wobj', author_permlink ); // root_wobj is author_permlink of wobject
};

const addAppendWobj = async function ( author_permlink, root_wobj ) {
    await postRefsClient.hsetAsync( author_permlink, 'type', 'append_wobj' ); // author_permlink is 'author' + '_' + 'permlink' of comment with appendWobject
    await postRefsClient.hsetAsync( author_permlink, 'root_wobj', root_wobj ); // root_wobj is author_permlink of wobject
};

const addObjectType = async function ( author, permlink, name ) {
    await postRefsClient.hsetAsync( `${author }_${ permlink}`, 'type', 'wobj_type' );
    await postRefsClient.hsetAsync( `${author }_${ permlink}`, 'name', name );
};

const setLastBlockNum = async function ( blockNum ) {
    if ( blockNum ) {
        const key = process.env.PARSE_ONLY_VOTES ? 'last_vote_block_num' : 'last_block_num';

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
