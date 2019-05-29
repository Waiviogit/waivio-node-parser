const { User } = require( '../models' );
const _ = require( 'lodash' );


const updateAccountParser = async ( operation ) => {
    if( operation.account && operation.json_metadata ) {
        const { result, error } = await User.update( { name: operation.account }, { json_metadata: operation.json_metadata } );

        if( error ) {
            console.error( error );
        } else if ( result ) {
            console.log( `User ${operation.account} update "json_metadata"` );
        }
    }
};

const followUserParser = async ( operation ) => {
    let json;

    try {
        json = JSON.parse( operation.json );
    } catch ( error ) {
        console.error( error );
        return;
    }
    // if ( json && Array.isArray( json ) && json[ 0 ] === 'follow' && json[ 1 ] && json[ 1 ].user && json[ 1 ].author_permlink && json[ 1 ].what ) {
    if ( _.get( json, '[0]' ) === 'follow' && _.get( json, '[1].follower' ) && _.get( json, '[1].following' ) && _.get( json, '[1].what' ) ) {
        if ( !_.isEmpty( json[ 1 ].what ) && json[ 1 ].what[ 0 ] === 'blog' ) { // if field what present - it's follow on user
            const { result } = await User.addUserFollow( json[ 1 ] );

            if ( result ) {
                console.log( `User ${json[ 1 ].follower} now following user ${json[ 1 ].following}!\n` );
            }
        } else { // else if missing - unfollow
            const { result } = await User.removeUserFollow( json[ 1 ] );

            if ( result ) {
                console.log( `User ${json[ 1 ].follower} now unfollow user ${json[ 1 ].following} !\n` );
            }
        }
    }
};

module.exports = {
    updateAccountParser, followUserParser
};
