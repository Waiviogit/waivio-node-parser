const { Post } = require( '../models' );
const { postsUtil } = require( '../utilities/steemApi' );
const { User } = require( '../models' );
const { redisSetter } = require( '../utilities/redis' );

const parse = async function ( operation, metadata ) {
    const data = {
        author: operation.author,
        permlink: operation.permlink,
        wobjects: metadata.wobj.wobjects,
        app: typeof metadata.app === 'string' ? metadata.app : ''
    };

    await User.checkAndCreate( { name: operation.author } );

    const { result, error } = await createOrUpdatePost( data );

    if ( error ) {
        console.error( error );
    }
    if ( result ) {
        console.log( `Post with wobjects created by ${operation.author}` );
    }
};

const createOrUpdatePost = async function ( data ) {
    const { post, err } = await postsUtil.getPost( data.author, data.permlink );

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
    await User.increaseCountPosts( data.author );
    const { result, error } = await Post.update( post );

    if ( error ) {
        return { error };
    }
    return { result };
};


module.exports = { parse };
