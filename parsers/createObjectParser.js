const { Wobj, User, ObjectType } = require( '../models' );
const { createObjectValidator } = require( '../validator' );
const { commentRefSetter, commentRefGetter } = require( '../utilities/commentRefService' );
const { uuid } = require( 'uuidv4' );
const _ = require( 'lodash' );

const parse = async ( operation, metadata ) => {
    const data = {
        author_permlink: operation.permlink,
        author: operation.author,
        creator: metadata.wobj.creator,
        app: metadata.app,
        community: metadata.community,
        is_posting_open: metadata.wobj.is_posting_open,
        is_extending_open: metadata.wobj.is_extending_open,
        default_name: metadata.wobj.default_name
    };
    const { wobject, error } = await createObject( data, operation );
    if( error ) console.error( error );
    if ( wobject ) console.log( `Waivio object ${data.default_name} created!\n` );
    await addSupposedUpdates( wobject );
};

const createObject = async ( data, operation ) => {
    try {
        await createObjectValidator.validate( data, operation );

        const objectTypeRef = await commentRefGetter.getCommentRef( `${operation.parent_author }_${ operation.parent_permlink}` );
        data.object_type = objectTypeRef.name;

        const { wObject, error } = await Wobj.create( data );
        if ( error ) return { error };

        await commentRefSetter.addWobjRef( `${data.author }_${ data.author_permlink}`, data.author_permlink );
        await User.increaseWobjectWeight( {
            name: data.creator,
            author_permlink: data.author_permlink,
            weight: 1
        } );

        return { wobject: wObject._doc };
    } catch ( error ) {
        return { error };
    }
};
/**
 * Unique script to fill objects with supposed updates for specified ObjectType.
 * Get list of supposed updates and send its to ImportService for create
 * @param wobject {Object}
 */
const addSupposedUpdates = async ( wobject ) => {
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
                permlink: `${wobject}-${update.name}-${randomString( 5 )}`,
                creator: 'monterey'
            };
            if( update.id_path ) field[ update.id_path ] = uuid();
            importWobjData.fields.push( field );
        } );
    } );
};

const randomString = ( length ) => {
    let result = '';
    let characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let charactersLength = characters.length;
    for ( let i = 0; i < length; i++ ) {
        result += characters.charAt( Math.floor( Math.random() * charactersLength ) );
    }
    return result;
};

module.exports = { parse };
