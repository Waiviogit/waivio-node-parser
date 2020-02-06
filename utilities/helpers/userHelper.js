const { importUser } = require('utilities/waivioApi');
const { checkAndCreate } = require('models/UserModel');
const _ = require('lodash');

/**
 * Create user in DB if it not exist,
 * if user already exists - just return
 * if user not exists or exists with ZERO "stage_v" =>
 * => start import user process on waivio-api
 * @param userName
 * @returns {Promise<void>}
 */
exports.checkAndCreateUser = async (userName) => {
  const { user, error } = await checkAndCreate(userName);
  if (error) return console.error(error);
  if (_.get(user, 'stage_v') === 0) {
    const { response, error: importError } = await importUser.send(userName);
    if (importError) {
      return console.error(importError);
    }
    return response;
  }
};
