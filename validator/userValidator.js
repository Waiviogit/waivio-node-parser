const { BLACK_LIST_BOTS } = require( '../utilities/constants' );
const _ = require( 'lodash' );

/**
 * Check that user not bit bot or other
 * @param names {[String]} Name(s) of user(s)(string or array of strings)
 * @returns {boolean} if true - user valid, else - user is bot, recommended to ignore operation with bots
 */
exports.validateUserOnBlacklist = ( names = [] ) => {
    let formattedNames = _.flatMap( [ names ], ( n ) => n );
    return !_.some( formattedNames, ( name ) => BLACK_LIST_BOTS.includes( name ) );
};
