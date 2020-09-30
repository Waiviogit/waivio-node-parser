const Joi = require('@hapi/joi');

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
