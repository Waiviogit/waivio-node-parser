const Joi = require('@hapi/joi');
const {
  WEIGHT_UNITS,
  DIMENSION_UNITS,
} = require('../../constants/wobjectsData');

const options = { allowUnknown: true, stripUnknown: true, convert: true };

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

exports.authorsSchema = Joi.object().keys({
  name: Joi.string().required(),
  authorPermlink: Joi.string(),
}).options(options);

exports.publisherSchema = Joi.object().keys({
  name: Joi.string().required(),
  authorPermlink: Joi.string(),
}).options(options);

exports.featuresSchema = Joi.object().keys({
  key: Joi.string().required(),
  value: Joi.string().required(),
}).options(options);

exports.namePermlinkSchema = Joi.object().keys({
  name: Joi.string(),
  authorPermlink: Joi.string(),
}).or('name', 'authorPermlink').options(options);

exports.widgetSchema = Joi.object().keys({
  column: Joi.string().required(),
  type: Joi.string().required(),
  content: Joi.string().required(),
}).options(options);

exports.newsFeedSchema = Joi.object().keys({
  allowList: Joi.array().items(Joi.array().items(Joi.string())),
  ignoreList: Joi.array().items(Joi.string()),
  typeList: Joi.array().items(Joi.string()),
  authors: Joi.array().items(Joi.string()),
}).options(options);

exports.departmentsSchema = Joi.object().keys({
  department: Joi.string().lowercase(),
}).options(options);
