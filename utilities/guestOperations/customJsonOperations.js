const { getWobjectsFromMetadata } = require( '../helpers/postByTagsHelper' );
const userParsers = require( '../../parsers/userParsers' );
const followObjectParser = require( '../../parsers/followObjectParser' );
const voteParser = require( '../../parsers/voteParser' );
const { validateProxyBot } = require( './guestHelpers' );
const { votePostHelper, voteFieldHelper } = require( '../../utilities/helpers' );
const { Post, User } = require( '../../models' );
const { postsUtil } = require( '../steemApi' );
const _ = require( 'lodash' );

exports.followUser = async ( operation ) => {
    if ( validateProxyBot( _.get( operation, 'required_posting_auths[0]', _.get( operation, 'required_auths[0]' ) ) ) ) {
        const json = parseJson( operation.json );
        if ( !json ) return;

        operation.required_posting_auths = [ _.get( json, '[1].follower' ) ];
        await userParsers.followUserParser( operation );
    }
};

exports.reblogPost = async ( operation ) => {
    if ( validateProxyBot( _.get( operation, 'required_posting_auths[0]', _.get( operation, 'required_auths[0]' ) ) ) ) {
        const json = parseJson( operation.json );
        if ( !json ) return;

        operation.required_posting_auths = [ _.get( json, '[1].account' ) ];
        await userParsers.followUserParser( operation );
    }
};

exports.followWobject = async ( operation ) => {
    if ( validateProxyBot( _.get( operation, 'required_posting_auths[0]', _.get( operation, 'required_auths[0]' ) ) ) ) {
        const json = parseJson( operation.json );
        if ( !json ) return;

        operation.required_posting_auths = [ _.get( json, '[1].user' ) ];
        await followObjectParser.parse( operation );
    }
};

exports.guestVote = async ( operation ) => {
    if ( validateProxyBot( _.get( operation, 'required_posting_auths[0]', _.get( operation, 'required_auths[0]' ) ) ) ) {
        const json = parseJson( operation.json );
        if ( !json ) return;

        const [ vote ] = await voteParser.votesFormat( [ json ] );
        if ( vote.type === 'post_with_wobj' || !vote.type ) {
            await voteOnPost( { vote } );
        } else if ( vote.type === 'append_wobj' ) {
            await voteOnField( { vote } );
        }
    }
};

exports.accountUpdate = async ( operation ) => {
    if ( validateProxyBot( _.get( operation, 'required_posting_auths[0]', _.get( operation, 'required_auths[0]' ) ) ) ) {
        const json = parseJson( operation.json );
        if ( !json ) return;
        await userParsers.updateAccountParser( json );
    }
};

exports.guestCreate = async ( operation ) => {
    if ( validateProxyBot( _.get( operation, 'required_posting_auths[0]', _.get( operation, 'required_auths[0]' ) ) ) ) {
        const json = parseJson( operation.json );
        if ( !json ) return;
        if ( !json.userId || !json.displayName || !json.json_metadata ) return;
        const { error: crError } = await User.checkAndCreate( json.userId );
        if ( crError ) {
            console.error( crError );
            return;
        }
        const { error: updError } = await User.updateOne(
            { name: json.userId },
            { json_metadata: json.json_metadata, alias: json.displayName }
        );
        if ( updError ) {
            console.error( updError );
            return;
        }
        console.log( `Guest user ${json.userId} updated!` );
    }
};

const voteOnPost = async ( { vote } ) => {
    let { post, error } = await Post.findOne( { root_author: vote.author, permlink: vote.permlink } );
    if ( !post ) {
        const { err, newPost } = await savePostInDB( _.pick( vote, [ 'author', 'permlink' ] ) );
        if ( err ) return;
        post = newPost.post;
    }
    if ( error || !post ) return;
    _.remove( post.active_votes, ( v ) => v.voter === vote.voter );
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

const voteOnField = async ( { vote } ) => {
    await voteFieldHelper.voteOnField( {
        author: vote.author,
        permlink: vote.permlink,
        voter: vote.voter,
        author_permlink: vote.root_wobj,
        percent: vote.weight,
        weight: 0,
        rshares_weight: 0
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

const savePostInDB = async ( data ) => {
    const { post, err } = await postsUtil.getPost( data.author, data.permlink );
    if( err ) return { err };
    if ( !post ) {
        const errorMessage = `No post in steem: @${data.author}/${data.permlink}`;
        console.error( errorMessage );
        return { err: errorMessage };
    }
    post.wobjects = await getWobjectsFromMetadata( post );
    const { error } = await Post.create( post );
    if ( error ) return { err: error };
    return { newPost: await Post.findOne( { author: data.author, permlink: data.permlink } ) };
};
