const wobjectOperations = require( './wobjectOperations' );
const emptyWobjects = require( '../resources/emptyWobjects' );

( async () => {
    await wobjectOperations.fillEmptyFields( emptyWobjects, process.argv[ 2 ] );
} )();
