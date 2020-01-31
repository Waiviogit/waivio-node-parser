const { postWithObjectParser } = require( '../../parsers' );
const { postsUtil } = require( '../steemApi' );

const updateCounters = async( author, permlink ) => {

    const { post, err } = await postsUtil.getPost( author, permlink );
    if ( err ) {
        console.error( err.message );
        return;
    }
    if( post.author ) {
        let metadata = {};
        try{
            metadata = JSON.parse( post.json_metadata );
        } catch ( e ) {
            console.error( err.message );
            return;
        }
        await postWithObjectParser.parse( { author, permlink }, metadata, post );
    }
};

module.exports = { updateCounters };
