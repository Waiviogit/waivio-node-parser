const _ = require('lodash');
const appHelper = require('utilities/helpers/appHelper');
const { cacheWrapper } = require('utilities/helpers/cacheHelper');

const getCachedBlackList = cacheWrapper(appHelper.getBlackListUsers);

const CACHE_BLACK_LIST_USERS = 'app_black_list_users';
const CACHE_BLACK_LIST_TTL = 60 * 5;
const cacheParams = { key: CACHE_BLACK_LIST_USERS, ttl: CACHE_BLACK_LIST_TTL };

/**
 * Check that user not bid-bot or other kind of bots
 * @param names {[String]} Name(s) of user(s)(string or array of strings)
 * @returns Promise{boolean} if true - user valid, else - user is bot,
 * recommended to ignore operation with bots
 */
exports.validateUserOnBlacklist = async (names = []) => {
  const formattedNames = _.flatMap([names], (n) => n);
  const { error, users } = await getCachedBlackList()(cacheParams);
  if (error) return true;
  return !_.some(formattedNames, (name) => users.includes(name));
};
