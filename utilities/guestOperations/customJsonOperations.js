const userParsers = require( '../../parsers/userParsers' );
const followObjectParser = require( '../../parsers/followObjectParser' );
const voteParser = require( '../../parsers/voteParser' );
const { validateProxyBot } = require( './guestHelpers' );
const { votePostHelper } = require( '../../utilities/helpers' );
const { Post } = require( '../../models' );
const _ = require( 'lodash' );

exports.followUser = async ( operation ) => {
    if( validateProxyBot( _.get( operation, 'required_posting_auths[0]' ) ) ) {
        const json = parseJson( operation.json );
        if( !json ) return;

        operation.required_posting_auths = [ _.get( json, '[1].follower' ) ];
        await userParsers.followUserParser( operation );
    }
};

exports.followWobject = async ( operation ) => {
    if( validateProxyBot( _.get( operation, 'required_posting_auths[0]' ) ) ) {
        const json = parseJson( operation.json );
        if( !json ) return;

        operation.required_posting_auths = [ _.get( json, '[1].user' ) ];
        await followObjectParser.parse( operation );
    }
};

exports.guestVote = async ( operation ) => {
    if( validateProxyBot( _.get( operation, 'required_posting_auths[0]' ) ) ) {
        const json = parseJson( operation.json );
        if( !json ) return;

        const [ vote ] = await voteParser.votesFormat( [ json ] );
        if( vote.type === 'post_with_wobj' ) {
            await voteOnPost( { vote } );
        } else if ( vote.type === 'append_wobj' ) {
            // vote on field
        }
    }
};

const voteOnPost = async ( { vote } ) => {
    const { post, error } = await Post.findOne( _.pick( vote, [ 'author', 'permlink' ] ) );
    if( error ) return;
    post.active_votes.push( {
        voter: vote.voter,
        percent: vote.weight,
        rshares: 1
    } );

    let metadata;
    if ( post.json_metadata !== '' ) {
        metadata = parseJson( post.json_metadata ); // parse json_metadata from string to JSON
        if ( !_.get( metadata, 'wobj' ) ) {
            metadata.wobj = { wobjects: vote.wobjects };
        }
    }

    await votePostHelper.voteOnPost( {
        post,
        metadata,
        percent: vote.weight,
        ..._.pick( vote, [ 'wobjects', 'author', 'permlink', 'voter' ] )
    } );
};

const parseJson = ( json ) => {
    try {
        const parsed = JSON.parse( json );
        return parsed;
    } catch ( error ) {
        console.error( error );
    }
};
