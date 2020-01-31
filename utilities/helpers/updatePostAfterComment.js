const postWithObjectParser = require( '../../parsers/postWithObjectParser' );
const { postsUtil } = require( '../steemApi' );
const { Post } = require( '../../database' ).models;

const updateCounters = async( author, permlink ) => {
    const { post, err } = await postsUtil.getPost( author, permlink );
    if ( err ) {
        console.error( err && err.message ? err.message : err );
        return;
    }
    if( post && post.author ) {
        try {
            const res = await Post.updateOne( {
                author: post.author, permlink: post.permlink
            }, {
                children: post.children
            } );
            if( res.ok ) console.log( `Post @${author}/${permlink} updated!` );
        } catch ( error ) {
            console.error( error );
        }
    //     let metadata = {};
    //     try{
    //         metadata = JSON.parse( post.json_metadata );
    //     } catch ( e ) {
    //         console.error( e );
    //         return;
    //     }
    //     await postWithObjectParser.parse( { author, permlink }, metadata, post );
    }
};

module.exports = { updateCounters };
