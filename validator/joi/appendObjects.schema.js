const Joi = require('@hapi/joi');
const {
  WEIGHT_UNITS,
  DIMENSION_UNITS,
} = require('../../constants/wobjectsData');
const { VALID_AFFILIATE_GEO } = require('../../constants/affiliateData');

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
  department: Joi.string().required(),
}).options(options);

exports.shopFilterSchema = Joi.object().keys({
  type: Joi.string(),
  departments: Joi.array().items(Joi.array().items(Joi.string())),
  tags: Joi.array().items(Joi.string()),
  authorities: Joi.array().items(Joi.string()),
}).or('type', 'departments', 'tags', 'authorities')
  .options(options);

exports.menuItemSchema = Joi.object().keys({
  title: Joi.string().required(),
  style: Joi.string().required(),
  image: Joi.string(),
  linkToObject: Joi.string(),
  linkToWeb: Joi.string().uri(),
}).or('linkToObject', 'linkToWeb')
  .options(options);

exports.validUrlSchema = Joi.string().uri();

exports.affiliateProductIdTypesSchema = Joi.array().items(Joi.string().lowercase()).min(1);

exports.affiliateCodeSchema = Joi.array().items(Joi.string()).min(2).max(2);

exports.affiliateGeoSchema = Joi.array().items(Joi.string().valid(...VALID_AFFILIATE_GEO)).min(1);
