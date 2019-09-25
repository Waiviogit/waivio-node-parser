const { Post, Wobj } = require( '../models' );
const { postsUtil } = require( '../utilities/steemApi' );
const { detectPostLanguageHelper } = require( '../utilities/helpers' );
const { User } = require( '../models' );
const { redisSetter } = require( '../utilities/redis' );
const { WOBJECT_LATEST_POSTS_COUNT } = require( '../utilities/constants' );

const parse = async function ( operation, metadata ) {
    const { user, error: userError } = await User.checkAndCreate( { name: operation.author } );
    if( error ) console.log( userError );

    const data = {
        author: operation.author,
        permlink: operation.permlink,
        wobjects: metadata.wobj.wobjects,
        app: typeof metadata.app === 'string' ? metadata.app : '',
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
    const { post, err } = await postsUtil.getPost( data.author, data.permlink ); // get post from steem api

    if ( err ) {
        return { error: err };
    }
    Object.assign( post, data ); // assign to post fields wobjects and app
    // here can be validators for post//
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
    await redisSetter.addPostWithWobj( `${data.author }_${ data.permlink}`, data.wobjects );
    // add language to post
    post.language = await detectPostLanguageHelper( post );
    const { result: updPost, error } = await Post.update( post );

    if ( error ) return { error };
    await User.increaseCountPosts( data.author );
    for( const author_permlink of data.wobjects.map( ( w ) => w.author_permlink ) ) {
        await Wobj.update( { author_permlink }, {
            $push: {
                latest_posts: {
                    $each: [ updPost._id ],
                    $position: 0,
                    $slice: WOBJECT_LATEST_POSTS_COUNT
                }
            },
            $inc: { count_posts: 1 }
        } );
    }
    return { updPost };
};

module.exports = { parse };
