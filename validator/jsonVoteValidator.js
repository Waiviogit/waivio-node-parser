const Joi = require('@hapi/joi');

const options = { allowUnknown: true, stripUnknown: true };

exports.voteSchema = Joi.object().keys({
  author: Joi.string().required(),
  permlink: Joi.string().required(),
  voter: Joi.string().required(),
  weight: Joi.number().min(0).max(10000).required(),
}).options(options);
