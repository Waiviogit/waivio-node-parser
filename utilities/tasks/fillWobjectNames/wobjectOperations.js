const objectBotRequest = require( './objectBotRequest' );
const emptyWobjects = require( '../resources/emptyWobjects' );
const _ = require( 'lodash' );
const fs = require( 'fs' );

const fillEmptyFields = async () => {
    if ( !_.isEmpty( emptyWobjects ) ) {
        let notAppended = [];
        for ( let wobject of emptyWobjects ) {
            const result = await objectBotRequest( wobject );
            if ( result !== 200 ) {
                console.log( `Some problems with append field to wobject: author: ${wobject.author} permlink: ${wobject.author_permlink}` );
                notAppended.push( wobject );
                continue;
            }
            console.log( `Successfully append field to wobject: author: ${wobject.author} permlink: ${wobject.author_permlink}` );
        }
        fs.writeFileSync( './utilities/tasks/resources/emptyWobjects.json', JSON.stringify( notAppended ) );
    }
};

module.exports = { fillEmptyFields };


( async () => {
    await fillEmptyFields();
    console.log();
} )();
