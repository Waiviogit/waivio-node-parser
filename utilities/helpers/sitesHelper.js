const {
  STATUSES, FEE, PARSE_MATCHING, TRANSFER_ID, REFUND_ID, PAYMENT_TYPES,
  REFUND_TYPES, REFUND_STATUSES, PATH, CAN_DELETE_STATUSES, CAN_MUTE_GLOBAL,
  SOCIAL_HOSTS, DEFAULT_BENEFICIARY, DEFAULT_REFERRAL, MAX_DEBT_PER_SITE, BILLING_TYPE,
} = require('constants/sitesData');
const {
  App, websitePayments, websiteRefunds, Wobj, mutedUserModel, Post, User, ServiceBotModel,
} = require('models');
const { MUTE_ACTION } = require('constants/parsersData');
const { sendSentryNotification } = require('utilities/helpers/sentryHelper');
const postHelper = require('utilities/helpers/postHelper');
const postModeration = require('utilities/moderation/postModeration');
const { sitesValidator } = require('validator');
const { FIELDS_NAMES } = require('constants/wobjectsData');
const { usersUtil } = require('utilities/steemApi');
const Sentry = require('@sentry/node');
const moment = require('moment');
const _ = require('lodash');
const redisSetter = require('utilities/redis/redisSetter');
const customJsonHelper = require('utilities/helpers/customJsonHelper');
const { paypalSubscriptionCheck } = require('utilities/waivioApi');
const config = require('config');
const { nginxService } = require('../nginxService');
const seoService = require('../socketClient/seoService');
const {
  REDIS_KEYS,
  CUSTOM_JSON_OPS,
} = require('../../constants/parsersData');

const checkForSocialSite = (host = '') => SOCIAL_HOSTS.some((sh) => host.includes(sh));

const validateServiceBot = async (name) => {
  const result = await ServiceBotModel.findOneByNameAndRole({
    name,
    role: 'serviceBot',
  });
  return Boolean(result);
};

const getDefaultAcc = (account = '') => {
  if (account.includes('_')) return DEFAULT_BENEFICIARY;
  return account;
};

exports.createWebsite = async (operation) => {
  if (!await validateServiceBot(customJsonHelper.getTransactionAccount(operation))) return;
  const json = parseJson(operation.json);
  const { result: parent } = await App.findOne({ host: json.parentHost, canBeExtended: true });
  if (!parent) return false;
  json.parent = parent._id;
  json.beneficiary = { account: getDefaultAcc(json.owner) };
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
  if (checkForSocialSite(json.parentHost)) {
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

  if (json.advanced && config.environment === 'production') {
    nginxService.createNginxConfig({ host: json.host });
    postHelper.setHostsToParseObjects();
  }
  seoService.sitemap.createSiteMap({ host: json.host });
};

const deleteSiteOp = async ({ host, userName }) => {
  const { result: app } = await App.findOne({
    host, owner: userName, inherited: true, status: { $in: CAN_DELETE_STATUSES },
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
  if (app.advanced && config.environment === 'production') {
    nginxService.removeNginxConfig({ host: app.host });
    postHelper.setHostsToParseObjects();
  }
  seoService.sitemap.deleteSitemap({ host: app.host });
};

exports.deleteWebsite = async (operation) => {
  if (!await validateServiceBot(customJsonHelper.getTransactionAccount(operation))) return;
  const json = parseJson(operation.json);
  await deleteSiteOp(json);
};

exports.activationActions = async (operation, activate) => {
  const owner = customJsonHelper.getTransactionAccount(operation);

  const json = parseJson(operation.json);
  if (!json || !owner) return false;

  const condition = {
    host: json.host,
    owner,
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
  const owner = customJsonHelper.getTransactionAccount(operation);
  const json = parseJson(operation.json);
  if (!json || !owner) return false;
  const { error, value } = sitesValidator.settingsSchema.validate(json);
  if (error) return captureException(error);

  const { result } = await App.findOne({ _id: value.appId, owner, inherited: true });
  if (!result) return;

  const keysToClearCache = ['googleGSCTag', 'googleEventSnippet', 'googleAdsConfig', 'googleAnalyticsTag'];
  const clearCache = !keysToClearCache.every((el) => result[el] === value[el]);
  if (clearCache) seoService.pages.deleteCachedPages({ host: result.host });

  await App.updateOne({ _id: value.appId, owner, inherited: true }, _.omit(value, ['appId']));
};

exports.saveAdSenseSettings = async (operation) => {
  const owner = customJsonHelper.getTransactionAccount(operation);

  const json = parseJson(operation.json);
  if (!json || !owner) return false;
  const { error, value } = sitesValidator.adSenseSchema.validate(json);
  if (error) return captureException(error);

  await App.updateOne({
    host: value.host, owner, inherited: true,
  }, {
    adSense: {
      level: value.level,
      code: value.code,
      txtFile: value.txtFile,
      displayUnitCode: value.displayUnitCode,
    },
  });
  const key = `${REDIS_KEYS.AD_SENSE}:${value.host}`;
  await redisSetter.deleteKey({ key });
};

exports.setCanonical = async (operation) => {
  const owner = customJsonHelper.getTransactionAccount(operation);
  const json = parseJson(operation.json);
  if (!json || !owner) return false;
  const { error, value } = sitesValidator.canonicalSchema.validate(json);
  if (error) return captureException(error);

  await App.updateOne({
    host: value.host, owner, inherited: true,
  }, {
    useForCanonical: true,
  });

  await App.updateMany({
    host: { $ne: value.host }, owner, inherited: true,
  }, {
    useForCanonical: false,
  });
};

exports.refundRequest = async (operation, blockNum) => {
  const owner = customJsonHelper.getTransactionAccount(operation);

  const json = parseJson(operation.json);
  if (!json || !owner) return false;

  const { payable: accountBalance, error } = await getAccountBalance(owner);
  if (error) return captureException(error);
  if (accountBalance <= 0) return false;

  const { result: refundRequest, error: refundError } = await websiteRefunds.findOne(
    { status: REFUND_STATUSES.PENDING, type: REFUND_TYPES.WEBSITE_REFUND, userName: owner },
  );
  if (refundError) return captureException(refundError);
  if (refundRequest) return false;

  const { error: createError, result } = await websiteRefunds.create({
    type: REFUND_TYPES.WEBSITE_REFUND,
    description: json.description,
    userName: owner,
    blockNum,
  });
  if (createError) return captureException(createError);
  return !!result;
};

const checkPayPalSubscription = async ({ host }) => {
  const { result: app } = await App.findOne(
    { host, billingType: BILLING_TYPE.PAYPAL_SUBSCRIPTION },
  );
  if (!app) return;

  paypalSubscriptionCheck.send({ host });
};

exports.createInvoice = async (operation, blockNum) => {
  const author = customJsonHelper.getTransactionAccount(operation);

  const json = parseJson(operation.json);

  if (!json || !author || !await validateServiceBot(author)) return false;

  const { error, value } = sitesValidator.createInvoice.validate(json);
  if (error) return false;

  const { result: app } = await App.findOne(
    { owner: value.userName, inherited: true, host: value.host },
  );
  if (!app) return;

  value.blockNum = blockNum;
  await websitePayments.create(value);

  const { userName, host } = value;

  await checkForSuspended(userName);
  await checkPayPalSubscription({ host });
};

exports.websiteAuthorities = async (operation, type, add) => {
  const owner = customJsonHelper.getTransactionAccount(operation);

  const json = parseJson(operation.json);
  if (!json || !owner) return false;

  const { error, value } = sitesValidator.authoritySchema.validate(json);
  if (error) {
    console.error(error.message);
    return false;
  }

  const condition = { owner, inherited: true, host: value.host };
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
  seoService.sitemap.createSiteMap({ host: json.host });
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

    await processMutedCollection(value);

    await processMutedBySiteAdministration(value);
  }
};

const getDefaultReferral = (account = '') => {
  if (account.includes('_')) return DEFAULT_REFERRAL;
  return account;
};

exports.setWebsiteReferralAccount = async (operation) => {
  const owner = customJsonHelper.getTransactionAccount(operation);

  const { host, account } = parseJson(operation.json);
  if (!host || !owner || !account) return false;
  const { result } = await App.findOne({ host, owner });
  if (!result) return false;
  await App.updateOne({ host, owner }, { [PATH.REFERRAL_ACCOUNT]: getDefaultReferral(account) });
  return true;
};

const trustedUpdateDataById = {
  [CUSTOM_JSON_OPS.WEBSITE_TRUSTED_SET]: (names) => ({ $addToSet: { trusted: { $each: names } } }),
  [CUSTOM_JSON_OPS.WEBSITE_TRUSTED_UNSET]: (names) => ({ $pullAll: { trusted: names } }),
};

/**
 * Collects all trusted users recursively in a more efficient way
 * @param {Object} params
 * @param {Array} params.trusted - Initial list of trusted users
 * @param {Object} params.trustedUsersMap - Map to track processed users and avoid duplicates
 * @param {Number} params.depth - Current recursion depth to prevent infinite loops
 * @param {Number} params.maxDepth - Maximum recursion depth
 * @returns {Promise<Array>} - Array of all trusted users
 */
const getTrusted = async ({
  trusted, trustedUsersMap = {}, depth = 0, maxDepth = 10,
}) => {
  // Prevent infinite recursion
  if (depth >= maxDepth) return Object.keys(trustedUsersMap);

  // Process all trusted users in parallel
  const trustedUsers = [...new Set(trusted)]; // Remove duplicates
  const trustedUserOwners = trustedUsers.filter((user) => !trustedUsersMap[user]);

  // If no new users to process, return the current map keys
  if (trustedUserOwners.length === 0) return Object.keys(trustedUsersMap);

  // Mark these users as processed
  trustedUserOwners.forEach((user) => {
    trustedUsersMap[user] = true;
  });

  // Fetch all apps owned by trusted users in a single query
  const { result: apps } = await App.find(
    { owner: { $in: trustedUserOwners } },
    { trusted: 1, owner: 1 },
  );

  if (!apps?.length) return Object.keys(trustedUsersMap);

  // Collect all nested trusted users
  const nestedTrustedUsers = [];
  apps.forEach((app) => {
    if (app.trusted && app.trusted.length) {
      nestedTrustedUsers.push(...app.trusted);
    }
  });

  // Recursively process nested trusted users
  if (nestedTrustedUsers.length > 0) {
    await getTrusted({
      trusted: nestedTrustedUsers,
      trustedUsersMap,
      depth: depth + 1,
      maxDepth,
    });
  }

  return Object.keys(trustedUsersMap);
};

/**
 * Updates the trustedAll list for a website
 * @param {Object} params
 * @param {String} params.owner - Website owner
 * @param {String} params.host - Website host
 */
exports.updateTrustedList = async ({ owner, host }) => {
  // Find selected site for update
  const { result } = await App.findOne(
    { owner, host },
    { trusted: 1, owner: 1 },
  );

  if (!result) return;

  const { trusted = [] } = result;

  // Get all trusted users including nested ones
  const trustedAll = await getTrusted({ trusted });

  // Update the app with the complete list of trusted users
  await App.updateOne(
    { owner, host },
    { $set: { trustedAll } },
  );
};

exports.setTrustedUsers = async (operation) => {
  const owner = customJsonHelper.getTransactionAccount(operation);
  const json = parseJson(operation.json);
  if (!json || !owner) return false;

  const { error, value } = sitesValidator.trustedSchema.validate(json);
  if (error) {
    console.error(error.message);
    return false;
  }

  const { names, host } = value;

  // we can check exist user in db

  const getDataFn = trustedUpdateDataById[operation.id];
  if (!getDataFn) return false;
  const updateData = getDataFn(names);

  await App.updateOne(
    { host: json.host, owner },
    updateData,
  );
  await this.updateTrustedList({ owner, host });
  // get apps where owner in trustedAll and update this apps
  const { result: appsToUpdate } = await App.find(
    {
      trustedAll: owner,
    },
    {
      owner: 1,
      host: 1,
    },
  );

  for (const appsToUpdateElement of appsToUpdate) {
    await this.updateTrustedList({
      owner: appsToUpdateElement.owner,
      host: appsToUpdateElement.host,
    });
  }
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

const parseJson = (json) => {
  try {
    return JSON.parse(json);
  } catch (error) {
    console.error(error.message);
    return null;
  }
};

const checkDebtToDelete = async ({ userName, payable }) => {
  if (payable > 0) return;
  const { result: count } = await App.countDocuments({
    owner: userName,
    inherited: true,
  });
  const debtForEachSite = Math.abs(payable / count);
  if (debtForEachSite > MAX_DEBT_PER_SITE) {
    const { result: apps } = await App.find({ owner: userName, inherited: true }, { host: 1 });
    for (const debtApp of apps) {
      await deleteSiteOp({ host: debtApp.host, userName });
    }
  }
};

const checkForSuspended = async (userName) => {
  const { result: suspended } = await App.findOne(
    { owner: userName, inherited: true, status: STATUSES.SUSPENDED },
    { _id: 1 },
  );

  const { payable } = await getAccountBalance(userName);

  if (payable < 0) {
    await App.updateMany({
      owner: userName, inherited: true, billingType: BILLING_TYPE.CRYPTO,
    }, { status: STATUSES.SUSPENDED });
    await websiteRefunds.deleteOne(
      { status: REFUND_STATUSES.PENDING, type: REFUND_TYPES.WEBSITE_REFUND, userName },
    );
    await checkDebtToDelete({ userName, payable });
  }
  // remove suspended status
  if (suspended && payable > 0) {
    const { result = [] } = await App.find(
      { owner: userName, inherited: true },
      { activatedAt: 1, deactivatedAt: 1, _id: 1 },
    );

    for (const app of result) {
      let status = STATUSES.PENDING;
      app.activatedAt ? status = STATUSES.ACTIVE : null;
      app.deactivatedAt ? status = STATUSES.INACTIVE : null;
      await App.updateOne({ _id: app._id }, { status });
    }
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
      case PAYMENT_TYPES.CREDIT:
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
