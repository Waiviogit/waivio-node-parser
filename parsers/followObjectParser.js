const { User, Wobj } = require( '../models' );

const parse = async function ( data ) {
    let json;

    try {
        json = JSON.parse( data.json );
    } catch ( error ) {
        console.error( error );
        return( error );
    }
    if ( json && json[ 0 ] === 'follow' && json[ 1 ] && json[ 1 ].user && json[ 1 ].author_permlink && json[ 1 ].what ) {
        if ( json[ 1 ].what.length ) { // if field what present - it's follow on object
            const { wobject, error } = await Wobj.getOne( { author_permlink: json[ 1 ].author_permlink } );
            if( !wobject || error ) {
                const resultMessage = error || `User ${json[ 1 ].user} try to follow non existing wobject: ${json[ 1 ].author_permlink}`;
                console.log( resultMessage );
                return ( resultMessage );
            }
            const { result } = await User.addObjectFollow( json[ 1 ] );
            if ( result ) {
                const resultMessage = `User ${json[ 1 ].user} now following wobject ${json[ 1 ].author_permlink}!\n`;
                console.log( resultMessage );
                return resultMessage;
            }
        } else { // else if missing - unfollow
            const { result } = await User.removeObjectFollow( json[ 1 ] );
            if ( result ) {
                const resultMessage = `User ${json[ 1 ].user} now unfollow wobject ${json[ 1 ].author_permlink} !\n`;
                console.log( resultMessage );
                return resultMessage ;
            }
        }
    }
};

module.exports = { parse };
