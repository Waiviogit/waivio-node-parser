const _ = require( 'lodash' );

/**
 * Validating post data before creating(updating) in db
 * Validate:
 *   * sum of percents on metadata wobjects (must be from 0 to 100, inclusive)
 * @param wobjects {[Object]}
 * @returns {boolean} Return true if post data valid, false if not equal to some condition
 */
exports.validate = ( { wobjects } ) => {
    const sum_percents = _.sumBy( wobjects, 'percent' );
    if ( !_.isEmpty( wobjects ) && ( sum_percents > 100 || sum_percents <= 0 ) ) return false;
    return true;
};
