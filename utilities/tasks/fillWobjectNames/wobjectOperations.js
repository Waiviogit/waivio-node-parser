const objectBotRequest = require( './objectBotRequest' );
const _ = require( 'lodash' );
const fs = require( 'fs' );

const fillEmptyFields = async ( emptyWobjects, host ) => {
    if ( _.isArray( emptyWobjects ) && host && host.match( /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,6}$/ ) ) {
        let notAppended = [];
        for ( let wobject of emptyWobjects ) {
            const result = await objectBotRequest( wobject, host );
            if ( result !== 200 ) {
                console.log( `Some problems with append field to wobject: author: ${wobject.author} permlink: ${wobject.author_permlink}` );
                notAppended.push( wobject );
                continue;
            }
            console.log( `Successfully append field to wobject: author: ${wobject.author} permlink: ${wobject.author_permlink}` );
        }
        if ( !_.isEmpty( notAppended ) ) fs.writeFileSync( './utilities/tasks/resources/notAppended.json', JSON.stringify( notAppended ) );
        console.log( 'Successfully finished' );
        return;
    }
    console.log( `Some problems with ${emptyWobjects} or host ${host}` );
};

module.exports = { fillEmptyFields };

