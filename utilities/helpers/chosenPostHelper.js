const { App } = require( '../../models' );
const { postsUtil } = require( '../steemApi' );
const { chosenPostValidator } = require( '../../validator' );
const _ = require( 'lodash' );
const VALIDATE_BODY_REGEX = /^#(?<period>daily|weekly) @(?<app>[a-zA-Z]{3,})/;

const getAppFromBodyStr = ( body_str ) => {
    const result = body_str.match( VALIDATE_BODY_REGEX );
    return _.get( result, 'groups.app' );
};

const getPeriodFromBodyStr = ( body_str ) => {
    const result = body_str.match( VALIDATE_BODY_REGEX );
    return _.get( result, 'groups.period' );
};

const updateAppChosenPost = async ( operation ) => {
    const app_name = getAppFromBodyStr( operation.body );
    const user_name = operation.author;

    let isAppValid = await chosenPostValidator.validateApp( app_name );
    let isRespUserValid = await chosenPostValidator.validateResponsibleUser( { app_name, user_name } );
    if ( !isAppValid || !isRespUserValid ) {
        console.error( `Not valid select chosen post for operation: ${JSON.stringify( operation, null, 2 )}` );
        return;
    }
    // get parent post to extract "title"
    const { post, err } = await postsUtil.getPost( operation.parent_author, operation.parent_permlink );
    if( err ) {
        console.error( err );
        return;
    }
    const { app, error } = await App.updateChosenPost( {
        name: app_name,
        author: operation.parent_author,
        permlink: operation.parent_permlink,
        title: _.get( post, 'title', '' ),
        period: getPeriodFromBodyStr( operation.body )
    } );
    if( error ) {
        console.error( error );
        return;
    }
    console.log( `${user_name} successfully update chosen post for app ${app_name}!` );
};

module.exports = { getAppFromBodyStr, getPeriodFromBodyStr, updateAppChosenPost };

