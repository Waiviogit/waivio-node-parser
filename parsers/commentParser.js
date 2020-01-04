const createObjectParser = require( './createObjectParser' );
const appendObjectParser = require( './appendObjectParser' );
const postWithObjectsParser = require( './postWithObjectParser' );
const objectTypeParser = require( './objectTypeParser' );
const { postByTagsHelper, investarenaForecastHelper, chosenPostHelper } = require( '../utilities/helpers' );
const { checkAppBlacklistValidity } = require( '../utilities/helpers' ).appHelper;
const { chosenPostValidator } = require( '../validator' );
const _ = require( 'lodash' );

const parse = async function ( operation ) { // data is operation[1] of transaction in block
    let metadata;

    try {
        if ( operation.json_metadata !== '' ) {
            metadata = JSON.parse( operation.json_metadata ); // parse json_metadata from string to JSON
        }
    } catch ( e ) {
        console.error( e );
    }

    if( !( await checkAppBlacklistValidity( metadata ) ) ) return;

    if ( operation.parent_author === '' && metadata ) {
        // comment without parent_author is POST
        await postSwitcher( { operation, metadata } );
    } else if ( operation.parent_author && operation.parent_permlink ) {
        // comment with parent_author is REPLY TO POST
        await commentSwitcher( ( { operation, metadata } ) );
    }
};

const postSwitcher = async ( { operation, metadata } ) => {
    if ( _.get( metadata.wobj, 'action' ) === 'createObjectType' ) {
        // case if user add wobjects when create post
        await objectTypeParser.parse( operation, metadata ); // create new Object Type
    } else if( _.isArray( _.get( metadata, 'wobj.wobjects' ) ) && !_.isEmpty( _.get( metadata, 'wobj.wobjects' ) ) ) {
        // create post with wobjects in database
        await postWithObjectsParser.parse( operation, metadata );
    } else {
        // case if post has no wobjects, then need add wobjects by tags, or create if it not exist
        const wobjects = await postByTagsHelper.wobjectsByTags( _.get( metadata, 'tags', [] ) );

        metadata.wobj = { wobjects: wobjects || [] };
        await postWithObjectsParser.parse( operation, metadata );
    }
    if ( metadata.wia ) {
        // add forecast to post(for investarena)
        await investarenaForecastHelper.updatePostWithForecast( {
            author: operation.author,
            permlink: operation.permlink,
            forecast: metadata.wia
        } );
    }
};

const commentSwitcher = async ( { operation, metadata } ) => {
    if ( _.get( metadata, 'wobj.action' ) ) {
        switch ( metadata.wobj.action ) {
            case 'createObject' :
                await createObjectParser.parse( operation, metadata );
                break;
            case 'appendObject' :
                await appendObjectParser.parse( operation, metadata );
                break;
        }
    }
    // look out comment for select chosen one post by specified app
    if( chosenPostValidator.checkBody( operation.body ) ) {
        await chosenPostHelper.updateAppChosenPost( operation );
    }

    if ( _.get( metadata, 'wia.exp_forecast' ) ) {
        await investarenaForecastHelper.updatePostWithExpForecast( {
            parent_author: operation.parent_author,
            parent_permlink: operation.parent_permlink,
            author: operation.author,
            exp_forecast: metadata.wia.exp_forecast
        } ); // add expired forecast to post(for investarena)
    }
};

module.exports = { parse };
