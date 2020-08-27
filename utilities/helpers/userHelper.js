const _ = require('lodash');
const moment = require('moment');
const { importUser } = require('utilities/waivioApi');
const userModel = require('models/UserModel');
const paymentHistoriesModel = require('models/PaymentHistoriesModel');
const { usersUtil } = require('utilities/steemApi');
const appHelper = require('utilities/helpers/appHelper');
const { REFERRAL_TYPES } = require('constants/appData');
const { REVIEW_DEBTS_TYPES } = require('constants/campaigns');


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
  const { users: steemUsers = [] } = await usersUtil.getUsers(names);
  for (const steemUser of steemUsers) {
    const { user } = await userModel.checkAndCreate(steemUser.name);
    if (_.get(user, 'stage_version') === 0) {
      await importUser.send(user.name);
    }
  }
};


exports.checkAndSetReferral = async (data) => {
  let json;
  try {
    json = JSON.parse(data.json);
  } catch (error) {
    console.error(error);
    return { error };
  }
  let author = _.get(data, 'required_posting_auths[0]');
  const agent = _.get(json, 'agent');
  const guestName = _.get(json, 'guestName');
  if (!author || !agent) return { error: 'Not valid data' };

  if (guestName) {
    const bots = await appHelper.getProxyBots(['proxyBot']);
    if (!_.includes(bots, author)) {
      return { error: 'Author of guest info must be one of our bots' };
    }
    author = guestName;
  }

  const { users = [], referralsData = [] } = await appHelper.getBlackListUsers();
  if (_.includes(users, agent)) {
    return { error: 'Author in black list!' };
  }

  switch (json.type) {
    case REFERRAL_TYPES.REVIEWS:
      const referralTypeData = _.find(referralsData,
        (referral) => referral.type === json.type);

      const { users: dbUsers } = await userModel.find({ name: { $in: [author, agent] } });
      const user = _.find(dbUsers, { name: author });
      const agentAcc = _.find(dbUsers, { name: agent });

      if (!user || dbUsers.length !== 2) return { error: 'One of users not exists' };
      if (!agentAcc.allowReferral) return { error: 'Agent not allow referral' };

      const { result } = await paymentHistoriesModel.findOne(
        { userName: author, type: { $in: REVIEW_DEBTS_TYPES } },
      );

      if (result || _.get(user, 'referrals', []).length) {
        return { error: 'User is not new' };
      }

      await userModel.updateOne({ name: author }, {
        $push: {
          referral: {
            agent,
            type: json.type,
            startedAt: moment.utc().toDate(),
            endedAt: moment.utc().add(_.get(referralTypeData, 'duration', 90), 'day').toDate(),
          },
        },
      });
      break;
    default:
      break;
  }
};
