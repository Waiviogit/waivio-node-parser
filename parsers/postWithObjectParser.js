const { Post, Wobj } = require( '../models' );
const { postsUtil } = require( '../utilities/steemApi' );
const { detectPostLanguageHelper } = require( '../utilities/helpers' );
const { User } = require( '../models' );
const { commentRefSetter } = require( '../utilities/commentRefService' );
const { postWithWobjValidator } = require( '../validator' );
const _ = require( 'lodash' );

const parse = async function ( operation, metadata ) {
    const { user, error: userError } = await User.checkAndCreate( operation.author );
    if( userError ) console.log( userError );

    const data = {
        author: operation.author,
        permlink: operation.permlink,
        wobjects: _ .chain( metadata ) .get( 'wobj.wobjects', [] ) .filter( ( w ) => w.percent > 0 && w.percent <= 100 ),
        app: _.isString( metadata.app ) ? metadata.app : '',
        author_weight: user.wobjects_weight
    };

    const { updPost, error } = await createOrUpdatePost( data );

    if ( error ) {
        console.error( error );
    }
    if ( updPost ) {
        console.log( `Post with wobjects created by ${operation.author}` );
    }
};

const createOrUpdatePost = async function ( data ) {
    const { post, err: steemError } = await postsUtil.getPost( data.author, data.permlink ); // get post from steem api
    if ( steemError ) return { error: steemError };

    Object.assign( post, data ); // assign to post fields wobjects and app

    // validate post data
    if( !postWithWobjValidator( { wobjects: data.wobjects } ) ) return;

    const existing = await Post.findOne( { author: data.author, permlink: data.permlink } );

    if ( !existing.post ) {
        post.active_votes = [];
    } else {
        post.active_votes = post.active_votes.map( ( vote ) => {
            return {
                voter: vote.voter,
                weight: Math.round( vote.rshares * 1e-6 ),
                percent: vote.percent
            };
        } );
    }
    // add language to post
    post.language = await detectPostLanguageHelper( post );
    // set reference "post_with_wobj"
    await commentRefSetter.addPostRef( `${data.author }_${ data.permlink}`, data.wobjects );

    const { result: updPost, error } = await Post.update( post );
    if ( error ) return { error };

    await User.increaseCountPosts( data.author );
    for( const author_permlink of data.wobjects.map( ( w ) => w.author_permlink ) ) {
        await Wobj.pushNewPost( { author_permlink, post_id: updPost._id } );
    }
    return { updPost };
};

module.exports = { parse };
