const createObjectParser = require( './createObjectParser' );
const appendObjectParser = require( './appendObjectParser' );
const postWithObjectsParser = require( './postWithObjectParser' );
const objectTypeParser = require( './objectTypeParser' );
const { postByTagsHelper, investarenaForecastHelper } = require( '../utilities/helpers' );
const { checkAppBlacklistValidity } = require( '../utilities/helpers' ).appHelper;
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
    if( !( await checkAppBlacklistValidity ) ) return;

    if ( operation.parent_author === '' && metadata ) { // comment without parent_author is POST
        if ( metadata.wobj ) { // case if user add wobjects when create post
            if ( _.get( metadata.wobj, 'action' ) === 'createObjectType' ) {
                await objectTypeParser.parse( operation, metadata ); // create new Object Type
            } else if ( metadata.wobj.wobjects && Array.isArray( metadata.wobj.wobjects ) ) {
                await postWithObjectsParser.parse( operation, metadata ); // create post with wobjects in database
            }
        } else if ( metadata.tags ) { // case if post has no wobjects, then need add wobjects by tags, or create if it not exist
            const wobjects = await postByTagsHelper.wobjectsByTags( metadata.tags );

            if ( wobjects && wobjects.length ) {
                metadata.wobj = { wobjects };
                await postWithObjectsParser.parse( operation, metadata );
            }
        }
        if ( metadata.wia ) {
            await investarenaForecastHelper.updatePostWithForecast( {
                author: operation.author,
                permlink: operation.permlink,
                forecast: metadata.wia
            } ); // add forecast to post(for wtrade)
        }
    } else if ( operation.parent_author && operation.parent_permlink ) { // comment with parent_author is REPLY TO POST
        if ( metadata && metadata.wobj ) {
            if ( metadata.wobj.action ) {
                switch ( metadata.wobj.action ) {
                    case 'createObject' :
                        await createObjectParser.parse( operation, metadata );
                        break;
                    case 'appendObject' :
                        await appendObjectParser.parse( operation, metadata );
                }
            }
        }

        if ( metadata && metadata.wia && metadata.wia.exp_forecast ) {
            await investarenaForecastHelper.updatePostWithExpForecast( {
                parent_author: operation.parent_author,
                parent_permlink: operation.parent_permlink,
                author: operation.author,
                exp_forecast: metadata.wia.exp_forecast
            } ); // add expired forecast to post(for wtrade)
        }
    }
};

module.exports = { parse };
