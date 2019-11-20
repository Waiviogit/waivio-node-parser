const { User, Post } = require( '../models' );
const _ = require( 'lodash' );


exports.updateAccountParser = async ( operation ) => {
    if( operation.account && operation.json_metadata ) {
        let parsed_metadata;

        try {
            parsed_metadata = JSON.parse( operation.json_metadata );
        } catch ( err ) {
            console.error( `Not valid metadata on user ${operation.account}` );
        }
        const { result, error } = await User.updateOne(
            { name: operation.account },
            { json_metadata: operation.json_metadata, alias: _.get( parsed_metadata, 'profile.name', null ) }
        );

        if( error ) {
            console.error( error );
        } else if ( result ) {
            console.log( `User ${operation.account} update "json_metadata"` );
        }
    }
};

exports.followUserParser = async ( operation ) => {
    let json;

    try {
        json = JSON.parse( operation.json );
    } catch ( error ) {
        console.error( error );
        return;
    }
    if( _.get( json, '[0]' ) === 'reblog' ) {
        await this.reblogPostParser( json );
    }
    // if ( json && Array.isArray( json ) && json[ 0 ] === 'follow' && json[ 1 ] && json[ 1 ].user && json[ 1 ].author_permlink && json[ 1 ].what ) {
    if ( _.get( json, '[0]' ) === 'follow' && _.get( json, '[1].follower' ) && _.get( json, '[1].following' ) && _.get( json, '[1].what' ) ) {
        if ( _.get( json, '[1].what[0]' ) === 'blog' ) { // if field "what" present - it's follow on user
            const { result } = await User.addUserFollow( json[ 1 ] );
            if ( result ) {
                console.log( `User ${json[ 1 ].follower} now following user ${json[ 1 ].following}!` );
            }
        } else { // else if missing - unfollow
            const { result } = await User.removeUserFollow( json[ 1 ] );
            if ( result ) {
                console.log( `User ${json[ 1 ].follower} now unfollow user ${json[ 1 ].following} !` );
            }
        }
    }
};

exports.reblogPostParser = async ( json ) => {
    if( _.get( json, '[1].account' ) && _.get( json, '[1].author' ) && _.get( json, '[1].permlink' ) ) {
        const { post, error } = await Post.findOne( {
            author: _.get( json, '[1].author' ),
            permlink: _.get( json, '[1].permlink' )
        } );
        if( error )return { error };

        const { post: createdPost, error: createPostError } = await Post
            .create( { ..._.omit( post, [ '_id' ] ), reblog_by: _.get( json, '[1].account' ) } );

        if( createPostError ) return { error: createPostError };
        if( createdPost )
            console.log( `User ${json[ 1 ].account} reblog post @${json[ 1 ].author}/${json[ 1 ].permlink}!` );
    }
};
