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
const { REQUIRED_POSTING_AUTHS } = require('constants/parsersData');
const config = require('config');

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
  if (_.isEmpty(names)) return { hiveAccounts: [] };

  const { users: steemUsers = [] } = await usersUtil.getUsers(names);
  for (const steemUser of steemUsers) {
    const { user } = await userModel.checkAndCreate(steemUser.name);
    if (_.get(user, 'stage_version') === 0) {
      await importUser.send(user.name);
    }
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

      if (result || _.get(user, 'referrals', []).length) {
        return { error: 'User is not new' };
      }
      /** Add referral agent to user */
      return userModel.updateOne({ name: author }, {
        $push: {
          referral: {
            agent,
            type: json.type,
            startedAt: moment.utc().toDate(),
            endedAt: moment.utc().add(_.get(referralTypeData, 'duration', 90), 'day').toDate(),
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

exports.confirmReferralStatus = async (data) => {
  const json = jsonHelper.parseJson(data.json);
  if (_.isEmpty(json)) return { error: ERROR.INVALID_JSON };
  const author = _.get(json, 'agent');

  const { error } = await referralValidation(json, author, _.get(data, REQUIRED_POSTING_AUTHS));
  if (error) return { error };

  /** Set user referral status */
  return userModel.updateOne({ name: author },
    { $set: { referralStatus: REFERRAL_STATUSES.ACTIVATED } });
};

exports.rejectReferralStatus = async (data) => {
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
};
