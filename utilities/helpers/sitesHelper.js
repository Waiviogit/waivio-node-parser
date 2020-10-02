const { App, websitePayments } = require('models');
const moment = require('moment');
const _ = require('lodash');
const { sitesValidator } = require('validator');
const {
  STATUSES, FEE, PARSE_MATCHING, TRANSFER_ID,
} = require('constants/sitesData');

exports.activationActions = async (operation, activate) => {
  const author = _.get(operation, 'required_posting_auths[0]');
  const json = parseJson(operation.json);
  if (!json || !author) return;

  const condition = {
    _id: json.appId,
    owner: author,
    inherited: true,
    status: activate ? { $in: [STATUSES.PENDING, STATUSES.INACTIVE] } : STATUSES.ACTIVE,
    $or: [{ deactivatedAt: null }, { deactivatedAt: { $gt: moment.utc().subtract(6, 'month').toDate() } }],
  };
  const { result, error } = await App.findOne(condition);
  if (error || !result) {
    return console.error(_.get(error, 'message', 'Cant activate or deactivate, website not found'));
  }
  const updateData = activate
    ? { status: STATUSES.ACTIVE, activatedAt: moment.utc().toDate(), deactivatedAt: null }
    : { status: STATUSES.INACTIVE, deactivatedAt: moment.utc().toDate() };
  await App.updateOne({ _id: json.appId }, updateData);
};

exports.saveWebsiteSettings = async (operation) => {
  const author = _.get(operation, 'required_posting_auths[0]');
  const json = parseJson(operation.json);
  if (!json || !author) return;
  const { error, value } = sitesValidator.settingsSchema.validate(json);
  if (error) return console.error(error.message);

  await App.updateOne({ _id: value.appId, owner: author, inherited: true }, _.omit(value, ['appId']));
};

exports.websiteAuthorities = async (operation, type, add) => {
  const author = _.get(operation, 'required_posting_auths[0]');
  const json = parseJson(operation.json);
  if (!json || !author) return;

  const { error, value } = sitesValidator.authoritySchema.validate(json);
  if (error) return console.error(error.message);

  const condition = { owner: author, inherited: true, _id: value.appId };
  const updateData = add
    ? { $addToSet: { [type]: { $each: value.names } } }
    : { $pullAll: { [type]: value.names } };

  await App.updateOne(condition, updateData);
};

exports.parseSitePayments = async ({ operation, type, blockNum }) => {
  if ((type === TRANSFER_ID && operation.to !== FEE.account)
      || !operation.amount.includes(FEE.currency)) return;

  const payment = {
    type: PARSE_MATCHING[type],
    amount: parseFloat(operation.amount),
    userName: type === TRANSFER_ID ? operation.from : operation.to,
    blockNum,
  };
  await websitePayments.create(payment);
};


/** ------------------------PRIVATE METHODS--------------------------*/

const parseJson = (json) => {
  try {
    return JSON.parse(json);
  } catch (error) {
    console.error(error.message);
    return null;
  }
};
