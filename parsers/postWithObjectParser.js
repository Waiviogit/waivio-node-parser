const { Post, Wobj } = require( '../models' );
const { postsUtil } = require( '../utilities/steemApi' );
const { detectPostLanguageHelper, postHelper } = require( '../utilities/helpers' );
const { guestHelpers } = require( '../utilities/guestOperations' );
const { User } = require( '../models' );
const { commentRefSetter } = require( '../utilities/commentRefService' );
const { postWithWobjValidator } = require( '../validator' );
const _ = require( 'lodash' );

const parse = async function ( operation, metadata ) {
    const { user, error: userError } = await User.checkAndCreate( operation.author );
    if( userError ) console.log( userError );
    // get info about guest account(if post had been written from "guest" through proxy bot)
    const guestInfo = guestHelpers.getFromMetadataGuestInfo( { operation, metadata } );
    const data = {
        author: operation.author,
        permlink: operation.permlink,
        wobjects: _ .chain( metadata ) .get( 'wobj.wobjects', [] ) .filter( ( w ) => w.percent > 0 && w.percent <= 100 ).value(),
        app: _.isString( metadata.app ) ? metadata.app : '',
        author_weight: user.wobjects_weight,
        guestInfo
    };

    const result = await createOrUpdatePost( data );

    if ( _.get( result, 'error' ) ) {
        console.error( result.error );
    }
    if ( _.get( result, 'updPost' ) ) {
        console.log( `Post with wobjects created by ${operation.author}` );
    }
};

const createOrUpdatePost = async function ( data ) {
    const { post, err: steemError } = await postsUtil.getPost( data.author, data.permlink ); // get post from steem api
    if ( steemError || !post || !post.author ) return { error: steemError || `Post @${data.author}/${data.permlink} not found or was deleted!` };

    Object.assign( post, data ); // assign to post fields wobjects and app

    // validate post data
    if( !postWithWobjValidator.validate( { wobjects: data.wobjects } ) ) return;
    // find post in DB
    //
    const existing = await Post.findOne( {
        author: _.get( data, 'guestInfo.userId', data.author ),
        permlink: data.permlink
    } );

    if ( !existing.post ) {
        post.active_votes = [];
        post._id = postHelper.objectIdFromDateString( post.created || Date.now() );
        await User.increaseCountPosts( _.get( data, 'guestInfo.userId', data.author ) );
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
    await commentRefSetter.addPostRef( `${data.author }_${ data.permlink}`, data.wobjects, _.get( data, 'guestInfo.userId' ) );
    // if post from guest user, in DB post save with {author: guest_user_name}
    post.author = _.get( data, 'guestInfo.userId', data.author );
    const { result: updPost, error } = await Post.update( post );
    if ( error ) return { error };

    for( const author_permlink of data.wobjects.map( ( w ) => w.author_permlink ) ) {
        await Wobj.pushNewPost( { author_permlink, post_id: updPost._id } );
    }
    return { updPost };
};

module.exports = { parse };
