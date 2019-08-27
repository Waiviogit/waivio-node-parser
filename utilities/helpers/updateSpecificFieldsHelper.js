const { Wobj } = require( '../../models' );
const { validateNewsFilter, validateMap } = require( '../../validator/specifiedFieldsValidator' );
const TAG_CLOUDS_UPDATE_COUNT = 5;
const RATINGS_UPDATE_COUNT = 4;
const _ = require( 'lodash' );

// "author" and "permlink" it's identity of FIELD which type of need to update
// "author_permlink" it's identity of WOBJECT
const update = async ( author, permlink, author_permlink ) => {
    const { field, error } = await Wobj.getField( author, permlink, author_permlink );

    if ( error || !field ) {
        return;
    }
    switch ( field.name ) {
        case 'parent' :
            const { wobjects: wobjParent } = await Wobj.getSomeFields( 'parent', author_permlink );

            if ( wobjParent && Array.isArray( wobjParent ) && wobjParent[ 0 ].fields && Array.isArray( wobjParent[ 0 ].fields ) ) {
                await Wobj.update( { author_permlink }, { parent: wobjParent[ 0 ].fields[ 0 ] } );
            }
            break;
        case 'tagCloud' :
            const { wobjects: wobjTagCloud } = await Wobj.getSomeFields( 'tagCloud', author_permlink );

            if( wobjTagCloud && Array.isArray( wobjTagCloud ) && wobjTagCloud[ 0 ].fields && Array.isArray( wobjTagCloud[ 0 ].fields ) ) {
                await Wobj.update( { author_permlink }, { tagClouds: wobjTagCloud[ 0 ].fields.slice( 0, TAG_CLOUDS_UPDATE_COUNT ) } );
            }
            break;
        case 'rating' :
            const { wobjects: wobjRating } = await Wobj.getSomeFields( 'rating', author_permlink );

            if( wobjRating && Array.isArray( wobjRating ) && wobjRating[ 0 ].fields && Array.isArray( wobjRating[ 0 ].fields ) ) {
                await Wobj.update( { author_permlink }, { ratings: wobjRating[ 0 ].fields.slice( 0, RATINGS_UPDATE_COUNT ) } );
            }
            break;
        case 'newsFilter' :
            const { wobjects: wobjNewsFilter } = await Wobj.getSomeFields( 'newsFilter', author_permlink );

            if( wobjNewsFilter && Array.isArray( wobjNewsFilter ) && wobjNewsFilter[ 0 ].fields && Array.isArray( wobjNewsFilter[ 0 ].fields ) ) {
                let newsFilter;

                try{
                    newsFilter = JSON.parse( wobjNewsFilter[ 0 ].fields[ 0 ] );
                } catch ( newsFilterParseError ) {
                    console.error( `Error on parse "newsFilter" field: ${ newsFilterParseError}` );
                    break;
                }
                if( validateNewsFilter( newsFilter ) ) {
                    await Wobj.update( { author_permlink }, { newsFilter } );
                }
            }
            break;
        case 'map' :
            const { wobjects: wobjMap } = await Wobj.getSomeFields( 'map', author_permlink );

            if( wobjMap && Array.isArray( wobjMap ) && Array.isArray( wobjMap[ 0 ].fields ) ) {
                let map;

                try{
                    map = JSON.parse( wobjMap[ 0 ].fields[ 0 ] );
                } catch ( mapParseError ) {
                    console.error( `Error on parse "map" field: ${ mapParseError}` );
                    break;
                }
                if( map.latitude && map.longitude ) {
                    map.latitude = Number( map.latitude );
                    map.longitude = Number( map.longitude );
                }
                if( validateMap( map ) ) {
                    await Wobj.update( { author_permlink }, { map: { type: 'Point', coordinates: [ map.longitude, map.latitude ] } } );
                }
            }
            break;
        case 'status' :
            const { wobjects: [ { fields } = {} ] } = await Wobj.getSomeFields( 'status', author_permlink );

            const status = _.chain( fields )
                .filter( ( f ) => {
                    try {
                        const parsed = JSON.parse( f );

                        if( parsed.title ) return true;
                    } catch ( e ) {
                        return false;
                    }
                } ).first()
                .value();

            if( status ) await Wobj.update( { author_permlink }, { status: JSON.parse( status ) } );
            break;
    }
};

module.exports = { update };
