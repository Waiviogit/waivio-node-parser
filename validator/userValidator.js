const _ = require('lodash');
const appHelper = require('utilities/helpers/appHelper');

/**
 * Check that user not bid-bot or other kind of bots
 * @param names {[String]} Name(s) of user(s)(string or array of strings)
 * @returns Promise{boolean} if true - user valid, else - user is bot,
 * recommended to ignore operation with bots
 */
exports.validateUserOnBlacklist = async (names = []) => {
  const formattedNames = _.flatMap([names], (n) => n);
  const { error, users } = await appHelper.getBlackListUsers();
  if (error) return true;
  return !_.some(formattedNames, (name) => users.includes(name));
};
