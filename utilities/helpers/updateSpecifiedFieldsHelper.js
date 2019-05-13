const { Wobj } = require( '../../models' );
const TAG_CLOUDS_UPDATE_COUNT = 5;
const RATINGS_UPDATE_COUNT = 4;

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
                await Wobj.update( { author_permlink }, { newsFilter } );
            }
            break;
    }
};

module.exports = { update };
