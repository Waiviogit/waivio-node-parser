const _ = require( 'lodash' );
const { redisGetter } = require( '../utilities/redis' );

const validate = async ( data, operation ) => {
    validateFields( data );
    await validatePostLinks( data, operation );
};

const validateFields = ( data ) => {
    const requiredFieldsAppendObject = 'name,body,locale,author,permlink,creator'.split( ',' );

    requiredFieldsAppendObject.forEach( ( field ) => {
        if ( _.isNil( data.field[ field ] ) ) {
            throw new Error( "Can't append object, not all required fields is filling!" );
        }
    } );
};

const validatePostLinks = async ( data, operation ) => {
    const result = await redisGetter.getHashAll( `${operation.parent_author}_${operation.parent_permlink}` );

    if ( !result || !result.type || result.type !== 'create_wobj' || !result.root_wobj ) {
        throw new Error( "Can't append object, parent comment isn't create Object comment!" );
    }
};

module.exports = { validate };
