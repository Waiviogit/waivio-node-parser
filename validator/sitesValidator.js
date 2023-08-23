const { SUPPORTED_CURRENCIES, APP_LANGUAGES, APP_ADSENCE_LEVELS } = require('constants/common');
const { PAYMENT_TYPES } = require('constants/sitesData');
const { MUTE_ACTION } = require('constants/parsersData');
const Joi = require('joi');

const options = { allowUnknown: true, stripUnknown: true };

exports.settingsSchema = Joi.object().keys({
  appId: Joi.string().required(),
  googleAnalyticsTag: Joi.string().allow(''),
  beneficiary: Joi.object().keys({
    account: Joi.string().required(),
    percent: Joi.number().min(1).max(10000).required(),
  }),
  currency: Joi.string().valid(...Object.values(SUPPORTED_CURRENCIES)).required(),
  language: Joi.string().valid(...APP_LANGUAGES).required(),
  objectControl: Joi.boolean().default(false),
}).options(options);

exports.adSenseSchema = Joi.object().keys({
  code: Joi.string().allow(''),
  host: Joi.string().required(),
  level: Joi.string().valid(...Object.values(APP_ADSENCE_LEVELS)).required(),
}).options(options);

exports.authoritySchema = Joi.object().keys({
  host: Joi.string().required(),
  names: Joi.array().items(Joi.string()).min(1).required(),
}).options(options);

exports.createInvoice = Joi.object().keys({
  type: Joi.string().default(PAYMENT_TYPES.WRITE_OFF),
  userName: Joi.string().required(),
  host: Joi.string().required(),
  amount: Joi.number().min(0).required(),
  countUsers: Joi.number().min(0).required(),
  description: Joi.string(),
}).options(options);

exports.muteUser = Joi.object().keys({
  mutedBy: Joi.string().required(),
  userName: Joi.string().required(),
  action: Joi.string().valid(...Object.values(MUTE_ACTION)).required(),
  mutedForApps: Joi.array().items(Joi.string()).required(),
});
