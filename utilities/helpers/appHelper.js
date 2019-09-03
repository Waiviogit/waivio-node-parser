const { App } = require( '../../models' );
const { getAppData } = require( '../../constants/appData' );
const _ = require( 'lodash' );

const checkAppBlacklistValidity = async ( metadata ) => {
    // get current app (app from comment)
    let checkApp = _.get( metadata, 'app' );
    if( !checkApp || typeof checkApp !== 'string' ) return true;
    checkApp = checkApp.split( '/' )[ 0 ];

    // get current "Running" app
    const { app, error } = await App.getOne( { name: ( getAppData() ).appName } );
    if( error ) return true;

    const re = new RegExp( `^${checkApp}$`, 'i' );
    const ignoredApps = _.chain( app ).get( 'blacklists.apps' ).filter( ( x ) => x.match( re ) ).value();

    return _.isEmpty( ignoredApps );
};

module.exports = { checkAppBlacklistValidity };
