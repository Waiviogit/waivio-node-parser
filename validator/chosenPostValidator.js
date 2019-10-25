const { App } = require( '../models' );
const VALIDATE_BODY_REGEX = /^#(daily|weekly) @[a-zA-Z]{3,}/;
const RESPONSIBLE_USER = 'admin';

const checkBody = ( body ) => {
    return VALIDATE_BODY_REGEX.test( body );
};

const validateApp = async ( name ) => {
    const { app, error } = await App.getOne( { name } );
    return !!app && !error;
};

const validateResponsibleUser = async ( { app_name, user_name } ) => {
    const { app, error } = await App.getOne( { name: app_name } );
    if( error ) {
        return false;
    }
    const resp_user = app[ RESPONSIBLE_USER ];
    return user_name === resp_user;
};

module.exports = { checkBody, validateApp, validateResponsibleUser };
