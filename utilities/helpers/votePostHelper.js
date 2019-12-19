const { Wobj, User, Post } = require( '../../models' );
const { getWobjectsFromMetadata } = require( './postByTagsHelper' );
const { validateUserOnBlacklist } = require( '../../validator/userValidator' );
const _ = require( 'lodash' );

const voteOnPost = async ( data ) => {
    // calculated value, for using in wobject environment
    const currentVote = data.post.active_votes.find( ( vote ) => vote.voter === data.voter );
    if ( !currentVote ) return;

    const weight = Math.round( currentVote.rshares * 1e-6 );

    if ( validateUserOnBlacklist( [ data.voter, data.post.author, data.guest_author ] ) && ( data.post.author !== data.voter && data.guest_author !== data.voter ) ) {
        await unvoteOnPost( data );
        if ( data.percent < 0 ) {
            await downVoteOnPost( data, weight ); // case for down-vote
        } else if ( data.percent > 0 ) {
            await upVoteOnPost( data, weight ); // case for up-vote
        }
    }
    data.post.wobjects = await getWobjectsFromMetadata( data );
    data.post.app = _.get( data, 'metadata.app', '' );
    data.post.active_votes = data.post.active_votes.map( ( vote ) => ( {
        voter: vote.voter,
        weight: Math.round( vote.rshares * 1e-6 ),
        percent: vote.percent,
        rshares: vote.rshares
    } ) );
    data.post.author = _.get( data, 'guest_author', data.post.author );
    await Post.update( data.post ); // update post info in DB
};


const unvoteOnPost = async function ( data ) { // method also using as undo previous vote before up- or down-vote
    const { post, error } = await Post.findOne( { author: _.get( data, 'guest_author', data.post.author ), permlink: data.post.permlink } );
    if ( !post || error ) return {};

    const existingVote = post.active_votes.find( ( vote ) => vote.voter === data.voter );
    if ( existingVote ) {
        if ( existingVote.weight < 0 ) { // if un-vote after down-vote, need increase only author weight in wobjects
            await downVoteOnPost( data, -existingVote.weight );
        } else if ( existingVote.weight > 0 ) { // if un-vote after up-vote, need decrease author, voter and wobject weights
            await upVoteOnPost( data, -existingVote.weight );
        }
    }
};

const downVoteOnPost = async function ( data, weight ) {
    if ( _.isArray( _.get( data, 'metadata.wobj.wobjects' ) ) ) {
        for( const wObject of _.get( data, 'metadata.wobj.wobjects', [] ) ) {
            const voteWeight = Number( weight * ( wObject.percent / 100 ).toFixed( 3 ) ); // calculate vote weight for each wobject in post

            await User.increaseWobjectWeight( {
                name: _.get( data, 'guest_author', data.post.author ),
                author_permlink: wObject.author_permlink, // decrease author weight in wobject
                weight: voteWeight
            } );
        }
    }
};

const upVoteOnPost = async function ( data, weight ) {
    for ( const wObject of _.get( data, 'metadata.wobj.wobjects', [] ) ) {
        const voteWeight = Number( ( weight * ( wObject.percent / 100 ) ).toFixed( 3 ) ); // calculate vote weight for each wobject in post

        await Wobj.increaseWobjectWeight( {
            author_permlink: wObject.author_permlink, // increase wobject weight
            weight: voteWeight
        } );
        await User.increaseWobjectWeight( {
            name: _.get( data, 'guest_author', data.post.author ),
            author_permlink: wObject.author_permlink, // increase author weight in wobject
            weight: Number( ( voteWeight * 0.75 ).toFixed( 3 ) )
        } );
        await User.increaseWobjectWeight( {
            name: data.voter,
            author_permlink: wObject.author_permlink, // increase voter weight in wobject if he isn't author
            weight: Number( ( voteWeight * 0.25 ).toFixed( 3 ) )
        } );
    }
};

module.exports = { voteOnPost };
