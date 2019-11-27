const { BLACK_LIST_BOTS } = require( '../utilities/constants' );

/**
 * Check that user not bit bot or other
 * @param name {String} Name of user
 * @returns {boolean} if true - user valid, else - user is bot, recommended to ignore operation with bots
 */
exports.validateUserOnBlacklist = ( name ) => {
    return !BLACK_LIST_BOTS.includes( name );
};
