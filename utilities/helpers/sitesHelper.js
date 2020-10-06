const { App, websitePayments, websiteRefunds } = require('models');
const moment = require('moment');
const _ = require('lodash');
const Sentry = require('@sentry/node');
const { sitesValidator } = require('validator');
const appHelper = require('utilities/helpers/appHelper');
const { PAYMENT_TYPES, REFUND_TYPES, REFUND_STATUSES } = require('constants/sitesData');

const {
  STATUSES, FEE, PARSE_MATCHING, TRANSFER_ID, REFUND_ID,
} = require('constants/sitesData');

exports.createWebsite = async (operation) => {
  if (!await validateServiceBot(_.get(operation, 'required_posting_auths[0]', _.get(operation, 'required_auths[0]')))) return;
  const json = parseJson(operation.json);
  const { result: parent } = await App.findOne({ host: json.parentHost, canBeExtended: true });
  if (!parent) return false;
  json.parent = parent._id;
  await App.create(json);
};

exports.deleteWebsite = async (operation) => {
  if (!await validateServiceBot(_.get(operation, 'required_posting_auths[0]', _.get(operation, 'required_auths[0]')))) return;
  const json = parseJson(operation.json);
  const { result: app } = await App.findOne({
    host: json.host, owner: json.userName, inherited: true, status: STATUSES.PENDING,
  });
  if (!app) return false;
  await App.deleteOne({ _id: app._id });
};

exports.activationActions = async (operation, activate) => {
  const author = _.get(operation, 'required_posting_auths[0]');
  const json = parseJson(operation.json);
  if (!json || !author) return false;

  const condition = {
    host: json.host,
    owner: author,
    inherited: true,
    status: activate ? { $in: [STATUSES.PENDING, STATUSES.INACTIVE] } : STATUSES.ACTIVE,
    $or: [{ deactivatedAt: null }, { deactivatedAt: { $gt: moment.utc().subtract(6, 'month').toDate() } }],
  };
  const { result, error } = await App.findOne(condition);
  if (error || !result) {
    console.error(_.get(error, 'message', 'Cant activate or deactivate, website not found'));
    return false;
  }
  const updateData = activate
    ? { status: STATUSES.ACTIVE, activatedAt: moment.utc().toDate(), deactivatedAt: null }
    : { status: STATUSES.INACTIVE, deactivatedAt: moment.utc().toDate() };
  await App.updateOne({ _id: result._id }, updateData);
};

exports.saveWebsiteSettings = async (operation) => {
  const author = _.get(operation, 'required_posting_auths[0]');
  const json = parseJson(operation.json);
  if (!json || !author) return false;
  const { error, value } = sitesValidator.settingsSchema.validate(json);
  if (error) {
    Sentry.captureException(error);
    return false;
  }

  await App.updateOne({ _id: value.appId, owner: author, inherited: true }, _.omit(value, ['appId']));
};

exports.refundRequest = async (operation, blockNum) => {
  const author = _.get(operation, 'required_posting_auths[0]');
  const json = parseJson(operation.json);
  if (!json || !author) return false;

  const { payable: accountBalance, error } = await getAccountBalance(author);
  if (error) {
    Sentry.captureException(error);
    return false;
  }
  if (accountBalance <= 0) return false;

  const { result: refundRequest, error: refundError } = await websiteRefunds.findOne(
    { status: REFUND_STATUSES.PENDING, type: REFUND_TYPES.WEBSITE_REFUND, userName: author },
  );
  if (refundError) {
    Sentry.captureException(refundError);
    return false;
  }
  if (refundRequest) return false;

  const { error: createError, result } = await websiteRefunds.create({
    type: REFUND_TYPES.WEBSITE_REFUND,
    description: json.description,
    userName: author,
    blockNum,
  });
  if (createError) {
    Sentry.captureException(createError);
    return false;
  }
  return !!result;
};

exports.websiteAuthorities = async (operation, type, add) => {
  const author = _.get(operation, 'required_posting_auths[0]');
  const json = parseJson(operation.json);
  if (!json || !author) return false;

  const { error, value } = sitesValidator.authoritySchema.validate(json);
  if (error) {
    console.error(error.message);
    return false;
  }

  const condition = { owner: author, inherited: true, _id: value.appId };
  const updateData = add
    ? { $addToSet: { [type]: { $each: value.names } } }
    : { $pullAll: { [type]: value.names } };

  await App.updateOne(condition, updateData);
};

exports.parseSitePayments = async ({ operation, type, blockNum }) => {
  if ((type === TRANSFER_ID && operation.to !== FEE.account)
      || !operation.amount.includes(FEE.currency)) return false;

  const payment = {
    type: PARSE_MATCHING[type],
    amount: parseFloat(operation.amount),
    userName: type === TRANSFER_ID ? operation.from : operation.to,
    blockNum,
  };
  await websitePayments.create(payment);
  if (type === REFUND_ID) {
    await websiteRefunds.updateOne(
      { userName: operation.to, status: REFUND_STATUSES.PENDING },
      { status: REFUND_STATUSES.COMPLETED },
    );
  }
};


/** ------------------------PRIVATE METHODS--------------------------*/

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
