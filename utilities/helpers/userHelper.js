const _ = require('lodash');
const moment = require('moment');
const { importUser } = require('utilities/waivioApi');
const userModel = require('models/UserModel');
const paymentHistoriesModel = require('models/PaymentHistoriesModel');
const { usersUtil } = require('utilities/steemApi');
const appHelper = require('utilities/helpers/appHelper');
const { REFERRAL_TYPES, REFERRAL_STATUSES } = require('constants/appData');
const { REVIEW_DEBTS_TYPES } = require('constants/campaigns');
const jsonHelper = require('utilities/helpers/jsonHelper');
const { ERROR } = require('constants/common');
const { REQUIRED_POSTING_AUTHS, REDIS_KEYS } = require('constants/parsersData');
const config = require('config');
const redisSetter = require('utilities/redis/redisSetter');

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
  if (!steemUser) return { error: { message: 'User is not found in blockchain!' } };
  const { user, error } = await userModel.checkAndCreate(userName);
  if (error) return { error };
  if (_.get(user, 'stage_version') === 0) {
    const { error: importError } = await importUser.send(userName);
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
  if (_.isEmpty(names)) return { hiveAccounts: [] };

  const { users: steemUsers = [] } = await usersUtil.getUsers(names);
  const { users } = await userModel.find({
    name:
      { $in: _.map(steemUsers, (user) => user.name) },
  }, { name: 1, stage_version: 1 });
  const notExistingUsers = users.length ? _.filter(steemUsers, (steemUser) => !_.some(users,
    (user) => _.includes(user.name, steemUser.name))) : steemUsers;
  const { users: savedUsers } = await userModel.createMany(_.map(notExistingUsers, (user) => _.pick(user, 'name')));
  if (savedUsers && savedUsers.length) users.push(...savedUsers);
  for (const user of users) {
    if (_.get(user, 'stage_version') === 0) await importUser.send(user.name);
  }

  return { hiveAccounts: steemUsers };
};

/** Set different referral types to users */
exports.checkAndSetReferral = async (data) => {
  const json = jsonHelper.parseJson(data.json);
  if (_.isEmpty(json)) return { error: ERROR.INVALID_JSON };

  let author = _.get(data, REQUIRED_POSTING_AUTHS);
  const agent = _.get(json, 'agent');
  if (!author || !agent) return { error: 'Not valid data' };

  const {
    result: {
      black_list_users = [],
      service_bots = [],
      referralsData = [],
    },
  } = await appHelper.getAppData(config.appHost);

  /** Check for guest user */
  const guestName = _.get(json, 'guestName');
  if (guestName) {
    const bot = _.find(service_bots,
      (record) => record.name === author);
    if (!bot) return { error: 'Author of guest info must be one of our bots' };
    author = guestName;
  }
  /** If agent in black list, dont allow referral */
  if (_.includes(black_list_users, agent)) return { error: 'Author in black list!' };

  /** Find users in DB, all users must exists, and agent mustnt have referral status rejected */
  const { users: dbUsers } = await userModel.find({ name: { $in: [author, agent] } });
  let user = _.find(dbUsers, { name: author });
  const agentAcc = _.find(dbUsers, { name: agent });
  if (!user) ({ user } = await this.checkAndCreateUser(author));
  if (!agentAcc) return { error: 'Agent account must exist' };

  if (agentAcc.referralStatus === REFERRAL_STATUSES.REJECTED) return { error: 'Agent not allow referral' };

  /** Switch referral types, now we have only reviews referral */
  switch (json.type) {
    case REFERRAL_TYPES.REWARDS:
    case REFERRAL_TYPES.REVIEWS:
      const referralTypeData = _.find(referralsData,
        (referral) => referral.type === json.type);

      const { result } = await paymentHistoriesModel.findOne(
        { userName: author, type: { $in: REVIEW_DEBTS_TYPES } },
      );

      if (_.get(user, 'referrals', []).length) {
        return { error: 'User is not new' };
      }
      const referralDuration = result
        ? _.get(referralTypeData, 'oldUserDuration', 5)
        : _.get(referralTypeData, 'duration', 90);
      /** Add referral agent to user */
      return userModel.updateOne({ name: author }, {
        $push: {
          referral: {
            agent,
            type: json.type,
            startedAt: moment.utc().toDate(),
            endedAt: moment.utc().add(referralDuration, 'day').toDate(),
          },
        },
      });
    default:
      break;
  }
};

const referralValidation = async (json, author, postingAuth) => {
  const isGuest = _.get(json, 'isGuest', false);
  if (isGuest) {
    const { result: { service_bots = [] } } = await appHelper.getAppData(config.appHost);
    const bot = _.find(service_bots,
      (record) => record.name === postingAuth);
    if (!bot) return { error: 'Author of guest info must be one of our bots' };
  }

  if (author !== postingAuth && !isGuest) {
    return { error: 'User who posted json not same with user in json' };
  }
  return { result: true };
};

exports.confirmReferralStatus = async (data, transactionId) => {
  const json = jsonHelper.parseJson(data.json);
  if (_.isEmpty(json)) return { error: ERROR.INVALID_JSON };
  const author = _.get(json, 'agent');

  const { error } = await referralValidation(json, author, _.get(data, REQUIRED_POSTING_AUTHS));
  if (error) return { error };
  await redisSetter.publishToChannel({
    channel: REDIS_KEYS.TX_ID_MAIN,
    msg: transactionId,
  });

  /** Set user referral status */
  return userModel.updateOne({ name: author },
    { $set: { referralStatus: REFERRAL_STATUSES.ACTIVATED } });
};

exports.rejectReferralStatus = async (data, transactionId) => {
  const json = jsonHelper.parseJson(data.json);
  if (_.isEmpty(json)) return { error: ERROR.INVALID_JSON };
  const author = _.get(json, 'agent');

  const { error } = await referralValidation(json, author, _.get(data, REQUIRED_POSTING_AUTHS));
  if (error) return { error };

  let { user } = await userModel.findOne(author);
  if (!user) ({ user } = await this.checkAndCreateUser(author));
  if (user.referralStatus !== REFERRAL_STATUSES.ACTIVATED) {
    return { error: 'User must have activated status' };
  }
  /** Set user referral status */
  await userModel.updateOne({ name: author },
    { $set: { referralStatus: REFERRAL_STATUSES.REJECTED } });

  /** Remove all referrals from agent */
  await userModel.update(
    { referral: { $elemMatch: { agent: author, endedAt: { $gt: moment.utc().toDate() } } } },
    { $set: { 'referral.$.endedAt': new Date() } },
  );
  await redisSetter.publishToChannel({
    channel: REDIS_KEYS.TX_ID_MAIN,
    msg: transactionId,
  });
};
