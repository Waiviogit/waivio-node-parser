const _ = require( 'lodash' );
const { commentRefGetter } = require( '../utilities/commentRefService' );

const validate = async ( data, operation ) => {
    validateFields( data );
    await validatePostLinks( operation );
};

const validateFields = ( data ) => {
    const requiredFieldsAppendObject = 'name,body,locale,author,permlink,creator'.split( ',' );

    requiredFieldsAppendObject.forEach( ( field ) => {
        if ( _.isNil( data.field[ field ] ) ) {
            throw new Error( "Can't append object, not all required fields is filling!" );
        }
    } );
};

const validatePostLinks = async ( operation ) => {
    const result = await commentRefGetter.getCommentRef( `${operation.parent_author}_${operation.parent_permlink}` );

    if ( !result || !result.type || result.type !== 'create_wobj' || !result.root_wobj ) {
        throw new Error( "Can't append object, parent comment isn't create Object comment!" );
    }

    const existResult = await commentRefGetter.getCommentRef( `${operation.author}_${operation.permlink}` );

    if( existResult ) {
        throw new Error( "Can't append object, append is now exist!" );
    }
};

module.exports = { validate, validateFields, validatePostLinks };
