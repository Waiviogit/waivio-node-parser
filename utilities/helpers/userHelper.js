const { importUser } = require('utilities/waivioApi');
const { checkAndCreate } = require('models/UserModel');
const { usersUtil } = require('utilities/steemApi');
const _ = require('lodash');

/**
 * Create user in DB if it not exist,
 * if user already exists - just return
 * if user not exists or exists with ZERO "stage_v" =>
 * => start import user process on waivio-api
 * @param userName
 * @returns {Promise<{user: *}|{error: *}>}
 */
exports.checkAndCreateUser = async (userName) => {
  const { user: steemUser } = await usersUtil.getUser(userName);
  if (!steemUser) return { error: { message: 'User is not found in steem!' } };
  const { user, error } = await checkAndCreate(userName);
  if (error) return { error };
  if (_.get(user, 'stage_version') === 0) {
    const { response, error: importError } = await importUser.send(userName);
    if (importError) {
      return { error: importError };
    }
  }
  return { user };
};

/**
 * Create users in DB if they not exist,
 * if user already exists - just return
 * if user not exists or exists with ZERO "stage_v" =>
 * => start import user process on waivio-api
 * @param names {[String]}
 * @returns {Promise<void>}
 */
exports.checkAndCreateByArray = async (names) => {
  const { users: steemUsers } = await usersUtil.getUsers(names);
  for (const steremUser of steemUsers) {
    const { user } = await checkAndCreate(steremUser.name);
    if (_.get(user, 'stage_version') === 0) {
      await importUser.send(user.name);
    }
  }
};
