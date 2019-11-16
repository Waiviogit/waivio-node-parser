const { postsUtil } = require( '../utilities/steemApi' );
const { User } = require( '../models' );
const { voteFieldHelper, votePostHelper } = require( '../utilities/helpers' );
// const redisGetter = require( '../utilities/redis/redisGetter' );
const { commentRefGetter } = require( '../utilities/commentRefService' );
const _ = require( 'lodash' );

const parse = async function ( votes ) {
    const votesOps = await votesFormat( votes );
    const posts = await getPosts(
        _.chain( votesOps )
            .filter( ( v ) => !!v.type )
            .uniqWith( ( x, y ) => x.author === y.author && x.permlink === y.permlink )
            .value()
    );

    await Promise.all( votesOps.map( async ( voteOp ) => {
        await parseVoteByType( voteOp, posts );
    } ) );
    console.log( `Parsed votes: ${ votesOps.length }` );
};

const parseVoteByType = async ( voteOp, posts ) => {
    if ( voteOp.type === 'post_with_wobj' ) {
        await votePostWithObjects( {
            author: voteOp.author, // author and permlink - identity of field
            permlink: voteOp.permlink,
            voter: voteOp.voter,
            percent: voteOp.weight, // in blockchain "weight" is "percent" of current vote
            wobjects: voteOp.wobjects,
            posts
        } );
    } else if ( voteOp.type === 'append_wobj' ) {
        await voteAppendObject( {
            author: voteOp.author, // author and permlink - identity of field
            permlink: voteOp.permlink,
            voter: voteOp.voter,
            percent: voteOp.weight, // in blockchain "weight" is "percent" of current vote
            author_permlink: voteOp.root_wobj,
            posts
        } );
    }
};

const voteAppendObject = async function ( data ) {
    // data include: author, permlink, percent, voter, author_permlink
    // author and permlink - identity of field
    // author_permlink - identity of wobject
    let { weight, error } = await User.checkForObjectShares( {
        name: data.voter,
        author_permlink: data.author_permlink
    } );
    if ( !weight || weight <= 0 || error ) weight = 1; // ignore users with zero or negative weight in wobject

    const currentVote = _.chain( data.posts )
        .find( { author: data.author, permlink: data.permlink } )
        .get( 'active_votes', [] )
        .find( { voter: data.voter } )
        .value();
    // voters weight in wobject
    data.weight = weight;
    data.rshares_weight = Math.round( Number( currentVote.rshares ) * 1e-6 );

    await voteFieldHelper.voteOnField( data );
};

const votePostWithObjects = async function ( data ) { // data include: post, metadata, voter, percent
    data.post = data.posts.find( ( p ) => p.author === data.author && p.permlink === data.permlink );
    if ( !data.post ) {
        return;
    }
    let metadata;

    try {
        if ( data.post.json_metadata !== '' ) {
            metadata = JSON.parse( data.post.json_metadata ); // parse json_metadata from string to JSON
        }
    } catch ( e ) {
        console.error( e );
    }
    if ( !metadata ) {
        return;
    }
    if ( !metadata.wobj ) {
        metadata.wobj = { wobjects: data.wobjects };
    }
    data.metadata = metadata;

    await votePostHelper.voteOnPost( data );
};

const getPosts = async function ( postsRefs ) {
    let posts = [];

    await Promise.all( postsRefs.map( async ( postRef ) => {
        const { post } = await postsUtil.getPost( postRef.author, postRef.permlink );

        if ( post ) {
            posts.push( post );
        }
    } ) );
    return posts;
}; // get list of posts from steemit

const votesFormat = async ( votesOps ) => {
    for ( const voteOp of votesOps ) {
        const redisResponse = await commentRefGetter.getCommentRef( `${voteOp.author}_${voteOp.permlink}` );

        if ( redisResponse && redisResponse.type ) {
            voteOp.type = redisResponse.type;
            voteOp.root_wobj = redisResponse.root_wobj;
            voteOp.wobjects = redisResponse.wobjects ? JSON.parse( redisResponse.wobjects ) : [];
            voteOp.name = redisResponse.name;
        }
    }
    return votesOps;
}; // format votes, add to each type of comment(post with wobj, append wobj etc.)

module.exports = { parse };
