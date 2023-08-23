const {
  STATUSES, FEE, PARSE_MATCHING, TRANSFER_ID, REFUND_ID, PAYMENT_TYPES,
  REFUND_TYPES, REFUND_STATUSES, PATH, CAN_DELETE_STATUSES, CAN_MUTE_GLOBAL,
  SOCIAL_HOSTS,
} = require('constants/sitesData');
const {
  App, websitePayments, websiteRefunds, Wobj, mutedUserModel, Post, User,
} = require('models');
const { REQUIRED_AUTHS, REQUIRED_POSTING_AUTHS, MUTE_ACTION } = require('constants/parsersData');
const { sendSentryNotification } = require('utilities/helpers/sentryHelper');
const postModeration = require('utilities/moderation/postModeration');
const { sitesValidator, objectBotsValidator } = require('validator');
const { FIELDS_NAMES } = require('constants/wobjectsData');
const appHelper = require('utilities/helpers/appHelper');
const { usersUtil } = require('utilities/steemApi');
const Sentry = require('@sentry/node');
const moment = require('moment');
const _ = require('lodash');

const checkForSocialSite = (host = '') => SOCIAL_HOSTS.some((sh) => host.includes(sh));

exports.createWebsite = async (operation) => {
  if (!await validateServiceBot(_.get(operation, REQUIRED_POSTING_AUTHS, _.get(operation, REQUIRED_AUTHS)))) return;
  const json = parseJson(operation.json);
  const { result: parent } = await App.findOne({ host: json.parentHost, canBeExtended: true });
  if (!parent) return false;
  json.parent = parent._id;
  json.beneficiary = { account: json.owner };
  json.parentHost = parent.host;
  const { result } = await App.findOne({ owner: json.owner, status: STATUSES.SUSPENDED });
  if (result) json.status = STATUSES.SUSPENDED;
  await App.create(json);

  const managerNames = _.compact([...CAN_MUTE_GLOBAL, json.owner]);
  for (const mangerName of managerNames) {
    await this.changeManagersMuteList({
      mangerName, host: json.host, action: MUTE_ACTION.MUTE,
    });
    await postModeration
      .addToSiteModeratorsHiddenPosts({ host: json.host, moderator: mangerName });
  }
  if (checkForSocialSite(json.host)) {
    const { user } = await User.findOne(json.owner);
    const profileImage = user?.profile_image
      || parseJson(user?.posting_json_metadata)?.profile?.profile_image;

    await App.updateOne(
      { host: json.host },
      {
        'configuration.shopSettings': { type: 'user', value: json.owner },
        ...(profileImage && {
          'configuration.desktopLogo': profileImage,
          'configuration.mobileLogo': profileImage,
          'configuration.defaultListImage': profileImage,
        }),
      },
    );
  }
};

exports.deleteWebsite = async (operation) => {
  if (!await validateServiceBot(_.get(operation, REQUIRED_POSTING_AUTHS, _.get(operation, REQUIRED_AUTHS)))) return;
  const json = parseJson(operation.json);
  const { result: app } = await App.findOne({
    host: json.host, owner: json.userName, inherited: true, status: { $in: CAN_DELETE_STATUSES },
  });
  if (!app) return false;
  await App.deleteOne({ _id: app._id });

  const managerNames = _.compact([_.get(app, 'owner'), ..._.get(app, 'moderators', []), ...CAN_MUTE_GLOBAL]);
  for (const mangerName of managerNames) {
    await this.changeManagersMuteList({
      mangerName, host: app.host, action: MUTE_ACTION.UNMUTE,
    });
    await postModeration
      .removeFromSiteModeratorsHiddenPosts({ host: app.host, moderator: mangerName });
  }
};

exports.activationActions = async (operation, activate) => {
  const author = _.get(operation, REQUIRED_POSTING_AUTHS);
  const json = parseJson(operation.json);
  if (!json || !author) return false;

  const condition = {
    host: json.host,
    owner: author,
    inherited: true,
    status: activate ? { $in: [STATUSES.PENDING, STATUSES.INACTIVE] } : STATUSES.ACTIVE,
    // $or: [{ deactivatedAt: null }, { deactivatedAt: { $gt: moment.utc().subtract(6, 'month').toDate() } }],
  };
  const { result, error } = await App.findOne(condition);
  if (error || !result) {
    console.error(_.get(error, 'message', 'Cant activate or deactivate, website not found'));
    return false;
  }
  const updateData = activate
    ? { status: STATUSES.ACTIVE, activatedAt: moment.utc().toDate(), deactivatedAt: null }
    : { status: STATUSES.INACTIVE, deactivatedAt: moment.utc().toDate(), activatedAt: null };
  await App.updateOne({ _id: result._id }, updateData);
};

exports.saveWebsiteSettings = async (operation) => {
  const author = _.get(operation, REQUIRED_POSTING_AUTHS);
  const json = parseJson(operation.json);
  if (!json || !author) return false;
  const { error, value } = sitesValidator.settingsSchema.validate(json);
  if (error) return captureException(error);

  await App.updateOne({ _id: value.appId, owner: author, inherited: true }, _.omit(value, ['appId']));
};

exports.saveAdSenseSettings = async (operation) => {
  const author = _.get(operation, REQUIRED_POSTING_AUTHS);
  const json = parseJson(operation.json);
  if (!json || !author) return false;
  const { error, value } = sitesValidator.adSenceSchema.validate(json);
  if (error) return captureException(error);

  await App.updateOne({
    host: value.host, owner: author, inherited: true,
  }, {
    adSence: {
      level: value.level,
      code: value.code,
    },
  });
};

exports.refundRequest = async (operation, blockNum) => {
  const author = _.get(operation, REQUIRED_POSTING_AUTHS);
  const json = parseJson(operation.json);
  if (!json || !author) return false;

  const { payable: accountBalance, error } = await getAccountBalance(author);
  if (error) return captureException(error);
  if (accountBalance <= 0) return false;

  const { result: refundRequest, error: refundError } = await websiteRefunds.findOne(
    { status: REFUND_STATUSES.PENDING, type: REFUND_TYPES.WEBSITE_REFUND, userName: author },
  );
  if (refundError) return captureException(refundError);
  if (refundRequest) return false;

  const { error: createError, result } = await websiteRefunds.create({
    type: REFUND_TYPES.WEBSITE_REFUND,
    description: json.description,
    userName: author,
    blockNum,
  });
  if (createError) return captureException(createError);
  return !!result;
};

exports.createInvoice = async (operation, blockNum) => {
  const author = _.get(operation, REQUIRED_POSTING_AUTHS);
  const json = parseJson(operation.json);
  if (!json || !author || !await objectBotsValidator.validate(author, 'serviceBot')) return false;

  const { error, value } = sitesValidator.createInvoice.validate(json);
  if (error) return false;

  value.blockNum = blockNum;
  await websitePayments.create(value);
  await checkForSuspended(value.userName);
};

exports.websiteAuthorities = async (operation, type, add) => {
  const author = _.get(operation, REQUIRED_POSTING_AUTHS);
  const json = parseJson(operation.json);
  if (!json || !author) return false;

  const { error, value } = sitesValidator.authoritySchema.validate(json);
  if (error) {
    console.error(error.message);
    return false;
  }

  const condition = { owner: author, inherited: true, host: value.host };
  const updateData = add
    ? { $addToSet: { [type]: { $each: value.names } } }
    : { $pullAll: { [type]: value.names } };

  await App.updateOne(condition, updateData);
  if (type === 'authority') await this.updateSupportedObjects({ host: value.host });
  if (type === 'moderators') {
    for (const mangerName of json.names) {
      await this.changeManagersMuteList({
        mangerName,
        host: json.host,
        action: add ? MUTE_ACTION.MUTE : MUTE_ACTION.UPDATE_HOST_LIST,
      });
      if (add) {
        await postModeration
          .addToSiteModeratorsHiddenPosts({ host: json.host, moderator: mangerName });
      } else {
        await postModeration
          .removeFromSiteModeratorsHiddenPosts({ host: json.host, moderator: mangerName });
      }
    }
  }
};

exports.parseSitePayments = async ({ operation, type, blockNum }) => {
  if ((type === TRANSFER_ID && operation.to !== FEE.account)
      || !operation.amount.includes(FEE.currency)) return false;

  const payment = {
    type: PARSE_MATCHING[type],
    amount: parseFloat(operation.amount),
    userName: type === TRANSFER_ID ? operation.from : operation.to,
    transferTo: operation.to,
    blockNum,
  };
  await websitePayments.create(payment);
  switch (type) {
    case REFUND_ID:
      await websiteRefunds.updateOne(
        { userName: operation.to, status: REFUND_STATUSES.PENDING },
        { status: REFUND_STATUSES.COMPLETED },
      );
      break;
    case TRANSFER_ID:
      const { result = [], error } = await App.find({ owner: operation.from, inherited: true });
      if (error) return captureException(error);

      const { payable: balance } = await getAccountBalance(operation.from);
      if (balance < 0 || _.get(result, '[0].status', '') !== STATUSES.SUSPENDED) return;

      for (const app of result) {
        let status = STATUSES.PENDING;
        app.activatedAt ? status = STATUSES.ACTIVE : null;
        app.deactivatedAt ? status = STATUSES.INACTIVE : null;
        await App.updateOne({ _id: app._id }, { status });
      }
  }
};

/** Update supported objects for website, find objects by all conditions,
 *  map coordinates, authorities, object filter */
exports.updateSupportedObjects = async ({ host, app }) => {
  if (!app)({ result: app } = await App.findOne({ host }));

  if (!app) {
    await sendSentryNotification();
    return Sentry.captureException({ error: { message: `Some problems with updateSupportedObject for app ${host}` } });
  }
  if (!(app.inherited && !app.canBeExtended)) return;
  const authorities = _.get(app, 'authority', []);
  const orMapCond = [], orTagsCond = [];
  if (app.mapCoordinates.length) {
    app.mapCoordinates.forEach((points) => {
      orMapCond.push({
        map: {
          $geoWithin: {
            $box: [points.bottomPoint, points.topPoint],
          },
        },
      });
    });
  }
  if (app.object_filters && Object.keys(app.object_filters).length) {
    for (const type of Object.keys(app.object_filters)) {
      const typesCond = [];
      for (const category of Object.keys(app.object_filters[type])) {
        if (app.object_filters[type][category].length) {
          typesCond.push({
            fields: {
              $elemMatch: {
                name: FIELDS_NAMES.CATEGORY_ITEM,
                body: { $in: app.object_filters[type][category] },
                tagCategory: category,
              },
            },
          });
        }
      }
      if (typesCond.length)orTagsCond.push({ $and: [{ object_type: type }, { $or: typesCond }] });
    }
  }
  const condition = {
    $and: [{
      $or: [{
        $expr: {
          $gt: [
            { $size: { $setIntersection: ['$authority.ownership', authorities] } },
            0,
          ],
        },
      }, {
        $expr: {
          $gt: [
            { $size: { $setIntersection: ['$authority.administrative', authorities] } },
            0,
          ],
        },
      }],
    }],
    object_type: { $in: app.supported_object_types },
  };
  if (orMapCond.length)condition.$and[0].$or.push(...orMapCond);
  if (orTagsCond.length) condition.$and.push({ $or: orTagsCond });

  const { result, error } = await Wobj.find(condition);
  if (error) {
    await sendSentryNotification();
    return Sentry.captureException(error);
  }
  await App.updateOne({ _id: app._id }, { $set: { supported_objects: _.map(result, 'author_permlink') } });
};

exports.mutedUsers = async ({ follower, following, action }) => {
  let globalMuteApps;

  if (typeof following === 'string') following = [following];
  if (!_.isArray(following)) return;
  const { result: apps } = await App.find({ $or: [{ owner: follower }, { moderators: follower }] });
  if (_.includes(CAN_MUTE_GLOBAL, follower)) globalMuteApps = await getAllAppsHost();

  for (const userToMute of following) {
    const filteredApps = _.filter(
      apps,
      (app) => (
        !_.includes(
          [app.owner, ...app.admins, ...app.moderators, ...app.authority],
          userToMute,
        )),
    );
    const { error, value } = sitesValidator.muteUser.validate({
      action, mutedBy: follower, mutedForApps: _.map(filteredApps, 'host'), userName: userToMute,
    });
    if (error) {
      console.error(error.message);
      continue;
    }
    if (globalMuteApps) value.mutedForApps = globalMuteApps;
    await processMutedCollection(value);
    if (_.isEmpty(value.mutedForApps)) continue;

    await processMutedBySiteAdministration(value);
  }
};

exports.changeManagersMuteList = async ({ mangerName, host, action }) => {
  const { mutedList: users } = await usersUtil.getMutedList(mangerName);
  for (const userToMute of users) {
    const { result: app } = await App.findOne({ host });
    if (!app) return;
    const appManagers = [app.owner, ...app.admins, ...app.moderators, ...app.authority];
    if (_.includes(appManagers, userToMute)) continue;
    const { error, value } = sitesValidator.muteUser.validate({
      action, mutedBy: mangerName, mutedForApps: [host], userName: userToMute,
    });
    if (error) {
      console.error(error.message);
      continue;
    }
    if (action === MUTE_ACTION.UPDATE_HOST_LIST) {
      await processMutedCollection({
        ...value,
        mutedForApps: _.filter(value.mutedForApps, (el) => el !== host),
      });
    }
    await processMutedBySiteAdministration(value);
  }
};

exports.setWebsiteReferralAccount = async (operation) => {
  const owner = _.get(operation, REQUIRED_POSTING_AUTHS);
  const { host, account } = parseJson(operation.json);
  if (!host || !owner || !account) return false;
  const { result } = await App.findOne({ host, owner });
  if (!result) return false;
  await App.updateOne({ host, owner }, { [PATH.REFERRAL_ACCOUNT]: account });
  return true;
};

/** ------------------------PRIVATE METHODS--------------------------*/
const getAllAppsHost = async () => {
  const { result } = await App.find({}, { host: 1 });
  return _.map(result, 'host');
};

const processMutedCollection = async ({
  userName, mutedBy, action, mutedForApps,
}) => {
  const collectionOperations = {
    [MUTE_ACTION.MUTE]: async () => mutedUserModel.muteUser({ userName, mutedBy, mutedForApps }),
    [MUTE_ACTION.UNMUTE]: async () => mutedUserModel.deleteOne({ userName, mutedBy }),
    [MUTE_ACTION.UPDATE_HOST_LIST]: async () => mutedUserModel
      .updateHostList({ userName, mutedBy, mutedForApps }),
  };
  return collectionOperations[action]();
};

const processMutedBySiteAdministration = async ({
  userName, mutedBy, mutedForApps, action,
}) => {
  switch (action) {
    case MUTE_ACTION.MUTE:
      await Post.updateMany(
        { $or: [{ author: userName }, { permlink: { $regex: new RegExp(`^${userName}\/`) } }] },
        { $addToSet: { blocked_for_apps: { $each: mutedForApps } } },
      );
      break;
    case MUTE_ACTION.UNMUTE:
      const { mutedUsers: mutedByOthers } = await mutedUserModel.find({
        userName,
        mutedBy: { $ne: mutedBy },
        mutedForApps: { $in: mutedForApps },
      });

      const unmuteFor = _.difference(
        mutedForApps,
        _.flatMap(mutedByOthers, (el) => el.mutedForApps),
      );

      await Post.updateMany(
        { $or: [{ author: userName }, { permlink: { $regex: new RegExp(`^${userName}\/`) } }] },
        { $pullAll: { blocked_for_apps: unmuteFor } },
      );
      break;
  }
};

const validateServiceBot = async (username) => {
  const WAIVIO_SERVICE_BOTS = await appHelper.getProxyBots(['serviceBot']);
  return WAIVIO_SERVICE_BOTS.includes(username);
};

const parseJson = (json) => {
  try {
    return JSON.parse(json);
  } catch (error) {
    console.error(error.message);
    return null;
  }
};

const checkForSuspended = async (userName) => {
  const { result: app } = await App.findOne(
    { owner: userName, inherited: true, status: STATUSES.SUSPENDED },
  );

  const { payable } = await getAccountBalance(userName);

  if (app || payable < 0) {
    await App.updateMany({ owner: userName, inherited: true }, { status: STATUSES.SUSPENDED });
    await websiteRefunds.deleteOne(
      { status: REFUND_STATUSES.PENDING, type: REFUND_TYPES.WEBSITE_REFUND, userName },
    );
  }
};

const getAccountBalance = async (account) => {
  const { error, result: payments } = await websitePayments.find({
    condition: { userName: account },
    sort: { createdAt: 1 },
  });
  if (error) return { error };
  let payable = 0;
  _.map(payments, (payment) => {
    switch (payment.type) {
      case PAYMENT_TYPES.TRANSFER:
        payment.balance = payable + payment.amount;
        payable = payment.balance;
        break;
      case PAYMENT_TYPES.WRITE_OFF:
      case PAYMENT_TYPES.REFUND:
        payment.balance = payable - payment.amount;
        payable = payment.balance;
        break;
    }
  });
  return { payable };
};

const captureException = async (error) => {
  await sendSentryNotification();
  Sentry.captureException(error);
  return false;
};
