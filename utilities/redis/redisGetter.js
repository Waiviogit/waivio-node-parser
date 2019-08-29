const { postRefsClient, lastBlockClient } = require( './redis' );
const PARSE_ONLY_VOTES = process.env.PARSE_ONLY_VOTES === 'true';

const getHashAll = async function ( key, client = postRefsClient ) {
    const res = await client.hgetallAsync( key );

    return res;
};

const getLastBlockNum = async function ( key ) {
    if( !key ) {
        key = PARSE_ONLY_VOTES ? 'last_vote_block_num' : 'last_block_num';
    }

    const num = await lastBlockClient.getAsync( key );

    return num ? parseInt( num ) : process.env.START_FROM_BLOCK || 29937113;
};

module.exports = { getHashAll, getLastBlockNum };
