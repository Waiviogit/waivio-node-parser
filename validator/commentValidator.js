const Joi = require('joi');

const options = { allowUnknown: true, stripUnknown: true };

exports.deleteCommentSchema = Joi.object().keys({
  author: Joi.string().required(),
  permlink: Joi.string().required(),
}).options(options);
