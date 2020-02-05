const _ = require('lodash');
const { BLACK_LIST_BOTS } = require('../utilities/constants');

/**
 * Check that user not bid-bot or other kind of bots
 * @param names {[String]} Name(s) of user(s)(string or array of strings)
 * @returns {boolean} if true - user valid, else - user is bot,
 * recommended to ignore operation with bots
 */
exports.validateUserOnBlacklist = (names = []) => {
  const formattedNames = _.flatMap([names], (n) => n);
  return !_.some(formattedNames, (name) => BLACK_LIST_BOTS.includes(name));
};
