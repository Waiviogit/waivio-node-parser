const { User } = require( '../models' );


const updateAccountParser = async ( operation ) => {
    if( operation.account && operation.json_metadata ) {
        const { result, error } = await User.update( { name: operation.account }, { json_metadata: operation.json_metadata } );

        if( error ) {
            console.error(error);
        } else if ( result ) {
            console.log( `User ${operation.account} update "json_metadata"` );
        }
    }
};

module.exports = {
    updateAccountParser
};
