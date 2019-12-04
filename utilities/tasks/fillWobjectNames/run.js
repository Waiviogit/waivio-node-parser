const wobjectOperations = require( './wobjectOperations' );
if ( !fs.existsSync( './utilities/tasks/resources' ) ) {
    fs.mkdirSync( './utilities/tasks/resources' );
    fs.writeFileSync( './utilities/tasks/resources/emptyWobjects.json', [] );
}
const emptyWobjects = require( '../resources/emptyWobjects' );

( async () => {
    await wobjectOperations.fillEmptyFields( emptyWobjects, process.argv[ 2 ] );
    process.exit();
} )();
