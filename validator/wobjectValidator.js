const _ = require( 'lodash' );

const validateRatingVote = ( data ) => {
    let isValid = true;
    const requiredFieldsRatingVote = 'author,permlink,author_permlink,rate'.split( ',' );

    requiredFieldsRatingVote.forEach( ( field ) => {
        if ( _.isNil( data[ field ] ) ) {
            isValid = false;
        }
    } );
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
    return isValid;
};

module.exports = {
    validateRatingVote, validateObjectType
};
