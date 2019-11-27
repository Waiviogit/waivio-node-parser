const { validateUserOnBlacklist } = require( './userValidator' );
const _ = require( 'lodash' );

const validateRatingVote = ( data ) => {
    let isValid = true;
    const requiredFieldsRatingVote = 'author,permlink,author_permlink,rate'.split( ',' );

    requiredFieldsRatingVote.forEach( ( field ) => {
        if ( _.isNil( data[ field ] ) ) {
            isValid = false;
        }
    } );
    if( _.get( data, 'rate' ) > 10 ) isValid = false;
    return isValid;
};

const validateObjectType = ( data ) => {
    let isValid = true;
    const requiredFieldsObjectType = 'author,permlink,name'.split( ',' );

    requiredFieldsObjectType.forEach( ( field ) => {
        if ( _.isNil( data[ field ] ) ) {
            isValid = false;
        }
    } );
    isValid = validateUserOnBlacklist( _.get( data, 'author' ) );
    return isValid;
};

module.exports = {
    validateRatingVote, validateObjectType
};
