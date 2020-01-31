const postWithObjectParser = require( '../../parsers/postWithObjectParser' );
const { postsUtil } = require( '../steemApi' );

const updateCounters = async( author, permlink ) => {
    const { post, err } = await postsUtil.getPost( author, permlink );
    if ( err ) {
        console.error( err && err.message ? err.message : err );
        return;
    }
    if( post && post.author ) {
        let metadata = {};
        try{
            metadata = JSON.parse( post.json_metadata );
        } catch ( e ) {
            console.error( e );
            return;
        }
        await postWithObjectParser.parse( { author, permlink }, metadata, post );
    }
};

module.exports = { updateCounters };
