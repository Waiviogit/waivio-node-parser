const { Wobj } = require( '../../models' );
const { importTags } = require( '../objectImportServiceApi' );
const _ = require( 'lodash' );
const DYNAMIC_HASHTAGS = process.env.DYNAMIC_HASHTAGS === 'true';

const wobjectsByTags = async ( tags ) => {
    const wobjects = [];
    const tagsImport = [];

    if ( tags && Array.isArray( tags ) ) {
        for ( const tag of _.compact( tags ) ) {
            let notValidChars = tag.match( /[^a-z0-9\-!?]+/g ); // skip not valid tags

            if ( !_.isEmpty( notValidChars ) ) {
                continue;
            }

            let { wobject } = await Wobj.getOne( { author_permlink: tag, object_type: 'hashtag' } );

            if ( wobject ) {
                wobjects.push( {
                    author_permlink: wobject.author_permlink,
                    percent: 100 / tags.length,
                    tagged: tag
                } );
            } else {
                tagsImport.push( tag );
            }
        }
    }
    if ( tagsImport.length && DYNAMIC_HASHTAGS ) {
        await importTags.send( tagsImport );
    }
    return wobjects;
};

module.exports = { wobjectsByTags };
