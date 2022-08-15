const Joi = require('@hapi/joi');

const options = { allowUnknown: true, stripUnknown: true };

exports.optionsSchema = Joi.object().keys({
  category: Joi.string().required(),
  value: Joi.string().required(),
  position: Joi.number().default(1),
  image: Joi.string(),
}).options(options);
