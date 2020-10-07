const Joi = require('@hapi/joi');
const { PAYMENT_TYPES } = require('constants/sitesData');

const options = { allowUnknown: true, stripUnknown: true };

exports.settingsSchema = Joi.object().keys({
  appId: Joi.string().required(),
  googleAnalyticsTag: Joi.string(),
  beneficiary: Joi.object().keys({
    account: Joi.string().required(),
    percent: Joi.number().min(1).max(10000).required(),
  }),
}).options(options);

exports.authoritySchema = Joi.object().keys({
  appId: Joi.string().required(),
  names: Joi.array().items(Joi.string()).min(1).required(),
}).options(options);

exports.createInvoice = Joi.object().keys({
  type: Joi.string().default(PAYMENT_TYPES.WRITE_OFF),
  userName: Joi.string().required(),
  host: Joi.string().required(),
  amount: Joi.number().min(0).required(),
  countUsers: Joi.number().min(0).required(),
}).options(options);
