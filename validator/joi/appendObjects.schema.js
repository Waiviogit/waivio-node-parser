const Joi = require('joi');
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
  title: Joi.string(),
  style: Joi.string().required(),
  image: Joi.string(),
  linkToObject: Joi.string(),
  objectType: Joi.string().when('linkToObject', {
    is: Joi.exist(),
    then: Joi.required(),
  }),
  linkToWeb: Joi.string().uri(),
}).or('linkToObject', 'linkToWeb')
  .options(options);

exports.validUrlSchema = Joi.string().uri();

exports.affiliateProductIdTypesSchema = Joi.string().lowercase().required();

exports.affiliateCodeSchema = Joi.array().items(Joi.string()).min(2).max(2);

exports.affiliateGeoSchema = Joi.string().valid(...VALID_AFFILIATE_GEO).required();

exports.mapTypesSchema = Joi.array().items(Joi.string()).min(1).required();

exports.mapViewSchema = Joi.object().keys({
  topPoint: Joi
    .array()
    .ordered(
      Joi.number().min(-180).max(180),
      Joi.number().min(-90).max(90),
    ).required(),
  bottomPoint: Joi
    .array()
    .ordered(
      Joi.number().min(-180).max(180),
      Joi.number().min(-90).max(90),
    ).required(),
  center: Joi.array().ordered(
    Joi.number().min(-180).max(180),
    Joi.number().min(-90).max(90),
  ).required(),
  zoom: Joi.number().min(1).max(18),
}).required();

exports.mapRectanglesSchema = Joi.array().items(Joi.object().keys({
  topPoint: Joi
    .array()
    .ordered(
      Joi.number().min(-180).max(180),
      Joi.number().min(-90).max(90),
    ).required(),
  bottomPoint: Joi
    .array()
    .ordered(
      Joi.number().min(-180).max(180),
      Joi.number().min(-90).max(90),
    ).required(),
})).required();
