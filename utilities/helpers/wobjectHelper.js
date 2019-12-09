const { ObjectType } = require( '../../models' );
const { importUpdates } = require( '../objectImportServiceApi' );
const { uuid } = require( 'uuidv4' );
const _ = require( 'lodash' );

/**
 * Unique script to fill objects with supposed updates for specified ObjectType.
 * Get list of supposed updates and send its to ImportService for create
 * @param wobject {Object}
 */
const addSupposedUpdates = async ( wobject ) => {
    if( !_.get( wobject, 'object_type' ) ) return;
    const { objectType, error: objTypeError } = await ObjectType.getOne( { name: wobject.object_type } );
    if( objTypeError ) return { error: objTypeError };

    const supposedUpdates = _.get( objectType, 'supposed_updates', [] );
    if( _.isEmpty( supposedUpdates ) ) return;
    let importWobjData = _.pick( wobject, [ 'author_permlink', 'object_type' ] );
    importWobjData.fields = [];
    supposedUpdates.forEach( ( update ) => {
        _.get( update, 'values', [] ).forEach( ( value ) => {
            let field = {
                name: update.name,
                body: value,
                permlink: `${wobject.author_permlink}-${update.name.toLowerCase()}-${randomString( 5 )}`,
                creator: 'monterey'
            };
            if( update.id_path ) field[ update.id_path ] = uuid();
            importWobjData.fields.push( field );
        } );
    } );
    await importUpdates.send( [ importWobjData ] );
};

const randomString = ( length = 5 ) => {
    let result = '';
    let characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    for ( let i = 0; i < length; i++ ) {
        result += characters.charAt( Math.floor( Math.random() * characters.length ) );
    }
    return result;
};

module.exports = { randomString, addSupposedUpdates };
