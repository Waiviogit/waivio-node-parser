const wobjectOperations = require( './wobjectsOperations' );

( async () => {
    await wobjectOperations.appendFields();
    process.exit();
} )();
