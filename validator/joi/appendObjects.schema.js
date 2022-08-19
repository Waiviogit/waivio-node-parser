const Joi = require('@hapi/joi');
const {
  WEIGHT_UNITS,
  DIMENSION_UNITS,
} = require('../../constants/wobjectsData');

const options = { allowUnknown: true, stripUnknown: true };

exports.optionsSchema = Joi.object().keys({
  category: Joi.string().required(),
  value: Joi.string().required(),
  position: Joi.number().default(1),
  image: Joi.string(),
}).options(options);

exports.weightSchema = Joi.object().keys({
  value: Joi.number().min(0).required(),
  unit: Joi.string().valid(...WEIGHT_UNITS).required(),
}).options(options);

exports.dimensionsSchema = Joi.object().keys({
  length: Joi.number().min(0).required(),
  width: Joi.number().min(0).required(),
  depth: Joi.number().min(0).required(),
  unit: Joi.string().valid(...DIMENSION_UNITS).required(),
}).options(options);
