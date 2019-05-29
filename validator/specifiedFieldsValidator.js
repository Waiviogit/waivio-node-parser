const _ = require( 'lodash' );

const validateNewsFilter = ( newsFilter ) => {
    let isValid = true;

    if( _.isNil( newsFilter ) ) {
        return false;
    }
    const requiredFields = [ 'allowList', 'ignoreList' ]; // [0] - array of arrays, [1] - array

    for( let field of requiredFields ) {
        if( _.isNil( newsFilter[ field ] ) ) {
            isValid = false;
        }
    }
    // first field is list of "allowed" rules for scheme
    if( !_.isNil( newsFilter[ requiredFields[ 0 ] ] ) ) {
        for( let allowRule of newsFilter[ requiredFields[ 0 ] ] ) {
            if( !_.isArray( allowRule ) ) {
                isValid = false;
            }
        }
    }
    // second field is list of "ignore" rules for scheme
    if( !_.isNil( newsFilter[ requiredFields[ 1 ] ] ) ) {
        if( !_.isArray( newsFilter[ requiredFields[ 1 ] ] ) ) {
            isValid = false;
        }
    }
    return isValid;
};

const validateMap = ( map ) => {
    if( _.isNil( map ) ) {
        return false;
    } else if( !map.longitude || typeof map.longitude !== 'number' || map.longitude < -180 || map.longitude > 180 ) {
        return false;
    } else if( !map.latitude || typeof map.latitude !== 'number' || map.latitude < -90 || map.latitude > 90 ) {
        return false;
    }
    return true;
};

module.exports = { validateNewsFilter, validateMap };
