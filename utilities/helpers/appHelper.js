const { App } = require( '../../models' );
const { appData } = require( '../../constants/appData' );
const _ = require( 'lodash' );

const checkAppBlacklistValidity = async ( metadata ) => {
    const checkApp = _.get( metadata, 'app' );

    if( !checkApp ) return true;
    const { app, error } = await App.getOne( { name: appData.appName } );

    if( error ) return true;
    const re = new RegExp( checkApp, 'i' );
    const ignoredApps = _.chain( app ).get( 'blacklists.apps' ).filter( ( x ) => x.match( re ) ).value();

    return _.isEmpty( ignoredApps );
};

module.exports = { checkAppBlacklistValidity };
