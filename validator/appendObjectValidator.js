const { commentRefGetter } = require( '../utilities/commentRefService' );
const { Wobj, ObjectType } = require( '../models' );
const { validateUserOnBlacklist } = require( './userValidator' );
const _ = require( 'lodash' );

const validate = async ( data, operation ) => {
    if( !validateUserOnBlacklist( operation.author ) || !validateUserOnBlacklist( _.get( data, 'field.creator' ) ) )
        throw new Error( "Can't append object, user in blacklist!" );
    validateFields( data );
    await validatePostLinks( operation );
    await validateSameFields( data );
    await validateFieldBlacklist( { author_permlink: data.author_permlink, fieldName: _.get( data, 'field.name' ) } );
};

const validateFields = ( data ) => {
    const requiredFieldsAppendObject = 'name,body,locale,author,permlink,creator'.split( ',' );

    requiredFieldsAppendObject.forEach( ( field ) => {
        if ( _.isNil( data.field[ field ] ) ) {
            throw new Error( "Can't append object, not all required fields is filling!" );
        }
    } );
};

const validateSameFields = async ( data ) => {
    const { wobject } = await Wobj.getOne( { author_permlink: data.author_permlink } );
    const foundedFields = _.map( wobject.fields, ( field ) => (
        { name: field.name, body: field.body, locale: field.locale } )
    );
    const result = foundedFields.find( ( field ) =>
        _.isEqual( field, _.pick( data.field, [ 'body', 'locale', 'name' ] ) ) );
    if ( result ) {
        throw new Error( "Can't append object, the same field already exists" );
    }
};

const validatePostLinks = async ( operation ) => {
    const result = await commentRefGetter
        .getCommentRef( `${operation.parent_author}_${operation.parent_permlink}` );

    if ( !result || !result.type || result.type !== 'create_wobj' || !result.root_wobj ) {
        throw new Error( "Can't append object, parent comment isn't create Object comment!" );
    }

    const existResult = await commentRefGetter
        .getCommentRef( `${operation.author}_${operation.permlink}` );

    if( existResult ) {
        throw new Error( "Can't append object, append is now exist!" );
    }
};

const validateFieldBlacklist = async ( { author_permlink, fieldName } ) => {
    const { wobject, error: wobjError } = await Wobj.getOne( { author_permlink } );
    if( wobjError ) throw new Error( wobjError );

    const { objectType, error: objTypeError } = await ObjectType.getOne( { name: wobject.object_type } );
    if( objTypeError ) throw new Error( objTypeError );

    if( _.get( objectType, 'updates_blacklist', [] ).includes( fieldName ) ) {
        throw new Error(
            `Can't append object, field ${fieldName} in black list for object type ${objectType.name}!`
        );
    }
};

module.exports = { validate };
