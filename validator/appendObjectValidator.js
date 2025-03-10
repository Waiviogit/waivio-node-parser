const _ = require('lodash');
const {
  Wobj,
  ObjectType,
  Post,
} = require('models');
const { commentRefGetter } = require('utilities/commentRefService');
const { validateUserOnBlacklist } = require('validator/userValidator');
const {
  validateNewsFilter,
  validateMap,
} = require('validator/specifiedFieldsValidator');
const {
  AUTHORITY_FIELD_ENUM,
  FIELDS_NAMES,
  OBJECT_TYPES,
} = require('constants/wobjectsData');
const {
  OBJECT_TYPES_FOR_COMPANY,
  OBJECT_TYPES_FOR_PRODUCT,
} = require('../constants/wobjectsData');
const {
  optionsSchema,
  weightSchema,
  dimensionsSchema,
  widgetSchema,
  newsFeedSchema,
  departmentsSchema,
  namePermlinkSchema,
  featuresSchema,
  shopFilterSchema,
  menuItemSchema,
  validUrlSchema,
  affiliateProductIdTypesSchema,
  affiliateGeoSchema,
  affiliateCodeSchema,
  mapTypesSchema,
  mapViewSchema,
  mapRectanglesSchema,
  walletAddressSchema,
} = require('./joi/appendObjects.schema');
const jsonHelper = require('../utilities/helpers/jsonHelper');
const objectPromotion = require('../utilities/objectUpdates/objectPromotion');

const cantAppendMessage = 'Can\'t append object, the same field already exists';

const validate = async (data, operation) => {
  if (!await validateUserOnBlacklist(operation.author)
    || !await validateUserOnBlacklist(_.get(data, 'field.creator'))) {
    throw new Error('Can\'t append object, user in blacklist!');
  }

  validateFields(data);
  await validatePostLinks(operation);
  await validateSameFields(data);
  await validateFieldBlacklist({
    author_permlink: data.author_permlink,
    fieldName: _.get(data, 'field.name'),
  });
  await validateSpecifiedFields(data, operation);
};

// validate that append has all required fields
const validateFields = (data) => {
  const requiredFieldsAppendObject = 'name,body,locale,author,permlink,creator'.split(',');

  requiredFieldsAppendObject.forEach((field) => {
    if (_.isNil(data.field[field])) {
      throw new Error('Can\'t append object, not all required fields is filling!');
    }
  });
};

const createReversedJSONStringArray = (input) => {
  const jsonObject = jsonHelper.parseJson(input, null);
  if (!jsonObject) return [input];
  const reversedJsonObject = {};

  const keys = Object.keys(jsonObject).reverse();
  for (const key of keys) {
    reversedJsonObject[key] = jsonObject[key];
  }

  return [input, JSON.stringify(reversedJsonObject)];
};

const validateSameFieldsProductId = ({ fieldData, foundedFields }) => {
  let same;
  for (const body of createReversedJSONStringArray(fieldData.body)) {
    const newField = { ...fieldData, body };
    same = foundedFields.find((field) => _.isEqual(_.pick(field, ['name', 'body', 'locale']), _.pick(newField, ['name', 'body', 'locale'])));
    if (same) throw new Error(cantAppendMessage);
  }
};
const validateSameFieldsUrl = ({ wobject }) => {
  if (wobject.object_type !== OBJECT_TYPES.LINK) throw new Error(cantAppendMessage);
  const result = wobject.fields?.find((field) => field.name === FIELDS_NAMES.URL);

  if (result) throw new Error(cantAppendMessage);
};

// validate that field with the same name and body don't exist already
const validateSameFields = async (data) => {
  const { wobject } = await Wobj.getOne({ author_permlink: data.author_permlink });
  const setUniqFields = ['name', 'body', 'locale'];

  if ([FIELDS_NAMES.PRODUCT_ID, FIELDS_NAMES.COMPANY_ID].includes(data.field.name)) {
    return validateSameFieldsProductId({
      fieldData: data.field,
      foundedFields: wobject.fields,
    });
  }

  if (FIELDS_NAMES.URL === data.field.name) return validateSameFieldsUrl({ wobject });

  if ([FIELDS_NAMES.CATEGORY_ITEM, FIELDS_NAMES.GALLERY_ALBUM, FIELDS_NAMES.GALLERY_ITEM].includes(data.field.name)) setUniqFields.push('id');
  if ([FIELDS_NAMES.AFFILIATE_CODE, FIELDS_NAMES.AUTHORITY].includes(data.field.name)) setUniqFields.push('creator');
  if (data.field.name === FIELDS_NAMES.PROMOTION) setUniqFields.push('startDate', 'endDate');
  if (data.field.name === FIELDS_NAMES.PHONE) setUniqFields.splice(1, 1, 'number');
  if (data.field.name === FIELDS_NAMES.LIST_ITEM) setUniqFields.splice(2, 1);

  const foundedFields = _.map(wobject.fields, (field) => _.pick(field, setUniqFields));
  const result = foundedFields.find((field) => _.isEqual(field, _.pick(data.field, setUniqFields)));

  if (result) throw new Error(cantAppendMessage);
};

// validate that parent comment is "createObject" comment
const validatePostLinks = async (operation) => {
  const result = await commentRefGetter
    .getCommentRef(`${operation.parent_author}_${operation.parent_permlink}`);

  if (!result || !result.type || result.type !== 'create_wobj' || !result.root_wobj) {
    throw new Error('Can\'t append object, parent comment isn\'t create Object comment!');
  }

  const existResult = await commentRefGetter
    .getCommentRef(`${operation.author}_${operation.permlink}`);

  if (existResult) {
    throw new Error('Can\'t append object, append is now exist!');
  }
};

// validate that current field allowed in specified Object Type
const validateFieldBlacklist = async ({
  author_permlink: authorPermlink,
  fieldName,
}) => {
  const {
    wobject,
    error: wobjError,
  } = await Wobj.getOne({ author_permlink: authorPermlink });
  if (wobjError) throw new Error(wobjError);

  const {
    objectType,
    error: objTypeError,
  } = await ObjectType.getOne({
    name: wobject.object_type,
  });
  if (objTypeError) throw new Error(objTypeError);

  if (_.get(objectType, 'updates_blacklist', [])
    .includes(fieldName)) {
    throw new Error(
      `Can't append object, field ${fieldName} in black list for object type ${objectType.name}!`,
    );
  }
};

// validate all special fields(e.g.map, categoryItem, newsFilter etc.)
const validateSpecifiedFields = async (data) => {
  const fieldName = _.get(data, 'field.name');
  switch (fieldName) {
    case FIELDS_NAMES.PARENT:
      const { wobject: parentWobject } = await Wobj.getOne({ author_permlink: data.field.body });
      if (!parentWobject) {
        throw new Error(`Can't append ${FIELDS_NAMES.PARENT} ${data.field.body}, wobject should exist`);
      }
      if (data.author_permlink === data.field.body) {
        throw new Error(`Can't append ${FIELDS_NAMES.PARENT} ${data.field.body}, wobject cannot be a parent to itself`);
      }
      break;

    case FIELDS_NAMES.NEWS_FILTER:
      let newsFilter;
      try {
        newsFilter = JSON.parse(data.field.body);
      } catch (newsFilterParseError) {
        throw new Error(`Error on parse "${FIELDS_NAMES.NEWS_FILTER}" field: ${newsFilterParseError}`);
      }
      if (!validateNewsFilter(newsFilter)) {
        throw new Error(`Can't append ${FIELDS_NAMES.NEWS_FILTER} ${data.field.body}, not valid data`);
      }
      break;

    case FIELDS_NAMES.MAP:
      let map;
      try {
        map = JSON.parse(data.field.body);
      } catch (mapParseError) {
        throw new Error(`Error on parse "${FIELDS_NAMES.MAP}" field: ${mapParseError}`);
      }
      if (map.latitude && map.longitude) {
        map.latitude = Number(map.latitude);
        map.longitude = Number(map.longitude);
      }
      if (!validateMap(map)) {
        throw new Error(`Can't append ${FIELDS_NAMES.MAP} ${data.field.body}, not valid data`);
      }
      break;

    case FIELDS_NAMES.TAG_CATEGORY:
      // "id" field is required
      if (!_.get(data, 'field.id')) {
        throw new Error(`Can't append ${FIELDS_NAMES.TAG_CATEGORY} ${data.field.body}, "id" is required`);
      }
      // tagCategory must be unique by id
      const { wobject: tagCategoryWobj } = await Wobj.getOne({
        author_permlink: data.author_permlink,
      });
      const existCategory = _
        .chain(tagCategoryWobj)
        .get('fields', [])
        .find({
          id: data.field.id,
          name: FIELDS_NAMES.TAG_CATEGORY,
        })
        .value();
      if (existCategory) {
        throw new Error(`Can't append ${FIELDS_NAMES.TAG_CATEGORY} ${data.field.body}, category with the same "id" exists`);
      }
      break;

    case FIELDS_NAMES.CATEGORY_ITEM:
      // "id" field is required
      if (!_.get(data, 'field.id')) {
        throw new Error(`Can't append ${FIELDS_NAMES.CATEGORY_ITEM} ${data.field.body}, "id" is required`);
      }
      // the body of the categoryItem must refer ot the real hashtag wobject
      const { wobject: existTag } = await Wobj.getOne({ author_permlink: data.field.body });
      if (_.get(existTag, 'object_type') !== OBJECT_TYPES.HASHTAG) {
        throw new Error(`Can't append ${FIELDS_NAMES.CATEGORY_ITEM} ${data.field.body}, Hashtag not valid!`);
      }

      const { wobject: categoryItemWobj } = await Wobj.getOne({
        author_permlink: data.author_permlink,
      });
      const parentCategory = _.chain(categoryItemWobj)
        .get('fields', [])
        .find({
          name: FIELDS_NAMES.TAG_CATEGORY,
          id: data.field.id,
        })
        .value();
      if (!parentCategory) {
        throw new Error(`Can't append ${FIELDS_NAMES.CATEGORY_ITEM} 
        ${data.field.body}, "${FIELDS_NAMES.TAG_CATEGORY}" with the same "id" doesn't exist`);
      }
      const existItem = _
        .chain(categoryItemWobj)
        .get('fields', [])
        .find({
          name: 'categoryItem',
          body: data.field.body,
          id: data.field.id,
        })
        .value();
      if (existItem) {
        throw new Error(`Can't append ${FIELDS_NAMES.CATEGORY_ITEM} 
      ${data.field.body}, item with the same "id" and "body" exist`);
      }
      break;

    case FIELDS_NAMES.AUTHORITY:
      if (!_.includes(Object.values(AUTHORITY_FIELD_ENUM), data.field.body)) {
        throw new Error(`Can't append ${FIELDS_NAMES.AUTHORITY} ${data.field.body}, not valid!`);
      }
      const { field } = await Wobj.getField(
        data.field.author,
        data.field.permlink,
        data.author_permlink,
        {
          'fields.name': FIELDS_NAMES.AUTHORITY,
          'fields.creator': data.field.creator,
          'field.body': data.field.body,
        },
      );
      if (field) {
        throw new Error(`Can't append ${FIELDS_NAMES.AUTHORITY} the same field from this creator is exists`);
      }
      break;

    case FIELDS_NAMES.COMPANY_ID:
    case FIELDS_NAMES.PRODUCT_ID:
    case FIELDS_NAMES.GROUP_ID:
      const { wobject: companyObject } = await Wobj.getOne({
        author_permlink: data.author_permlink,
      });
      const objectTypeNotCorresponding = !(
        _.includes(OBJECT_TYPES_FOR_COMPANY, companyObject.object_type)
          && fieldName === FIELDS_NAMES.COMPANY_ID
      )
        && !(
          _.includes(OBJECT_TYPES_FOR_PRODUCT, companyObject.object_type)
          && (fieldName === FIELDS_NAMES.PRODUCT_ID || fieldName === FIELDS_NAMES.GROUP_ID)
        );
      if (objectTypeNotCorresponding) {
        throw new Error(`Can't append ${fieldName} as the object type is not corresponding`);
      }
      if (fieldName === FIELDS_NAMES.PRODUCT_ID) await validateProductId(data.field.body);
      break;
    case FIELDS_NAMES.OPTIONS:
      const { error: optErr } = optionsSchema.validate(jsonHelper.parseJson(data.field.body));
      if (optErr) throw new Error(`Can't append ${fieldName}${optErr.message}`);
      break;
    case FIELDS_NAMES.WEIGHT:
      const { error: weightErr } = weightSchema.validate(jsonHelper.parseJson(data.field.body));
      if (weightErr) throw new Error(`Can't append ${fieldName}${weightErr.message}`);
      break;
    case FIELDS_NAMES.DIMENSIONS:
      const { error: dimensionErr } = dimensionsSchema
        .validate(jsonHelper.parseJson(data.field.body));
      if (dimensionErr) throw new Error(`Can't append ${fieldName}${dimensionErr.message}`);
      break;
    case FIELDS_NAMES.AUTHORS:
      const notValidAuthors = await validateAuthorsField(data.field.body);
      if (notValidAuthors) throw new Error(`Can't append ${fieldName}`);
      break;
    case FIELDS_NAMES.PUBLISHER:
      const notValidPublisher = await validatePublisherField(data.field.body);
      if (notValidPublisher) throw new Error(`Can't append ${fieldName}`);
      break;
    case FIELDS_NAMES.PRINT_LENGTH:
      if (_.isNaN(Number(data.field.body))) throw new Error(`Can't append ${fieldName}`);
      break;
    case FIELDS_NAMES.WIDGET:
      const { error: widgetErr } = widgetSchema.validate(jsonHelper.parseJson(data.field.body));
      if (widgetErr) throw new Error(`Can't append ${fieldName}${widgetErr.message}`);
      break;
    case FIELDS_NAMES.NEWS_FEED:
      const { error: newsFeedErr } = newsFeedSchema.validate(jsonHelper.parseJson(data.field.body));
      if (newsFeedErr) throw new Error(`Can't append ${fieldName}${newsFeedErr.message}`);
      break;
    case FIELDS_NAMES.DEPARTMENTS:
      const {
        value,
        error: departmentsErr,
      } = departmentsSchema
        .validate({ department: data.field.body });
      if (departmentsErr) throw new Error(`Can't append ${fieldName}${departmentsErr.message}`);
      data.field.body = value.department;
      break;
    case FIELDS_NAMES.MANUFACTURER:
    case FIELDS_NAMES.MERCHANT:
    case FIELDS_NAMES.BRAND:
      const notValidMerchant = await nameOrPermlinkValidation(
        data.field.body,
        [OBJECT_TYPES.BUSINESS],
      );
      if (notValidMerchant) throw new Error(`Can't append ${fieldName}`);
      break;
    case FIELDS_NAMES.FEATURES:
      const { error: featuresErr } = featuresSchema.validate(jsonHelper.parseJson(data.field.body));
      if (featuresErr) throw new Error(`Can't append ${fieldName}${featuresErr.message}`);
      break;
    case FIELDS_NAMES.PIN:
    case FIELDS_NAMES.REMOVE:
      const notPost = await postLinkValidation(data.field.body);
      if (notPost) throw new Error(`Can't append ${fieldName}`);
      break;
    case FIELDS_NAMES.SHOP_FILTER:
      const { error: shopFilterErr } = shopFilterSchema
        .validate(jsonHelper.parseJson(data.field.body));
      if (shopFilterErr) throw new Error(`Can't append ${fieldName}${shopFilterErr.message}`);
      break;
    case FIELDS_NAMES.MENU_ITEM:
      const notValidMenuItem = await menuItemValidation(data.field.body);
      if (notValidMenuItem) throw new Error(`Can't append ${fieldName}`);
      break;
    case FIELDS_NAMES.RELATED:
    case FIELDS_NAMES.ADD_ON:
    case FIELDS_NAMES.SIMILAR:
      const notValidObj = await permlinkValidation(data.field.body);
      if (notValidObj) throw new Error(`Can't append ${fieldName}`);
      break;
    case FIELDS_NAMES.AFFILIATE_BUTTON:
      const { error: affButtonErr } = validUrlSchema.validate(data.field.body);
      if (affButtonErr) throw new Error(`Can't append ${fieldName}`);
      break;
    case FIELDS_NAMES.AFFILIATE_PRODUCT_ID_TYPES:
      const { value: affIdTypes, error: affIdErr } = affiliateProductIdTypesSchema
        .validate(data.field.body);
      if (affIdErr) throw new Error(`Can't append ${fieldName}`);
      data.field.body = affIdTypes;
      break;
    case FIELDS_NAMES.AFFILIATE_GEO_AREA:
      const { error: affGeoErr } = affiliateGeoSchema
        .validate(data.field.body);
      if (affGeoErr) throw new Error(`Can't append ${fieldName}`);
      break;
    case FIELDS_NAMES.AFFILIATE_URL_TEMPLATE:
      if (!hasProductIdAndAffiliateCode(data.field.body)) {
        throw new Error(`Can't append ${fieldName}`);
      }
      break;
    case FIELDS_NAMES.AFFILIATE_CODE:
      const { value: affCodeField, error: affCodeErr } = affiliateCodeSchema
        .validate(jsonHelper.parseJson(data.field.body));
      if (affCodeErr) {
        throw new Error(`Can't append ${fieldName}`);
      }
      const [siteOrPersonalAff] = affCodeField;

      const codes = affCodeField.slice(1);
      if (codes.length > 1) {
        const validChance = affiliateCodesChanceValid(codes);
        if (!validChance) throw new Error(`Can't append ${fieldName}`);
      }
      data.field.body = JSON.stringify([removeProtocol(siteOrPersonalAff), ...codes]);
      break;
    case FIELDS_NAMES.MAP_OBJECT_TAGS:
    case FIELDS_NAMES.MAP_OBJECT_TYPES:
      // uniq
      const { value: mapTypes, error: mapTypesErr } = mapTypesSchema
        .validate(_.uniq(jsonHelper.parseJson(data.field.body)));
      if (mapTypesErr) {
        throw new Error(`Can't append ${fieldName}`);
      }
      data.field.body = JSON.stringify(mapTypes);
      break;
    case FIELDS_NAMES.MAP_MOBILE_VIEW:
    case FIELDS_NAMES.MAP_DESKTOP_VIEW:
      const { error: mapViewErr } = mapViewSchema
        .validate(jsonHelper.parseJson(data.field.body));
      if (mapViewErr) {
        throw new Error(`Can't append ${fieldName}`);
      }
      break;
    case FIELDS_NAMES.MAP_RECTANGLES:
      const { value: mapRectangles, error: mapRectanglesErr } = mapRectanglesSchema
        .validate(jsonHelper.parseJson(data.field.body));
      if (mapRectanglesErr) {
        throw new Error(`Can't append ${fieldName}`);
      }
      data.field.body = JSON.stringify(filterMapRectangles(mapRectangles));
      break;
    case FIELDS_NAMES.WALLET_ADDRESS:
      const { error: walletError } = walletAddressSchema
        .validate(jsonHelper.parseJson(data.field.body));
      if (walletError) {
        throw new Error(`Can't append ${fieldName}`);
      }
      break;

    case FIELDS_NAMES.PROMOTION: {
      const valid = await objectPromotion.validateOnAppend({
        field: data.field, objectPermlink: data.author_permlink,
      });
      if (!valid) throw new Error(`Can't append ${fieldName}`);
    }
      break;
  }
};

const affiliateCodesChanceValid = (codes) => {
  if (!Array.isArray(codes)
    || codes.length === 0) return false; // Handle non-array or empty array input

  const chances = codes.map((value) => {
    const parts = value.split('::');
    if (parts.length !== 2) return NaN;
    return Number(parts[1]);
  });

  const sum = chances.reduce((acc, el) => acc + el, 0);

  return sum === 100
    && chances.every((el) => el > 0 && !Number.isNaN(el)); // Ensure all are valid numbers > 0
};

const isRectangleIncluded = (rect1, rect2) => {
  const { topPoint: [x1, y1], bottomPoint: [x2, y2] } = rect1;
  const { topPoint: [x3, y3], bottomPoint: [x4, y4] } = rect2;

  return x3 >= x1 && x4 <= x2 && y3 >= y1 && y4 <= y2;
};

const filterMapRectangles = (rectangles = []) => rectangles
  .filter(
    (rect1, i) => !rectangles.some((rect2, j) => i !== j && isRectangleIncluded(rect2, rect1)),
  );

const removeProtocol = (str) => str.replace(/^(https?:\/\/(www\.)?)?/i, '');

const hasProductIdAndAffiliateCode = (str) => str.includes('$productId')
  && str.includes('$affiliateCode');

const menuItemValidation = async (body) => {
  const parsedBody = jsonHelper.parseJson(body, null);
  if (!parsedBody) return true;
  const { error: menuItemErr } = menuItemSchema
    .validate(parsedBody);
  if (menuItemErr) return true;
  if (!parsedBody.linkToObject) return false;
  const { wobject } = await Wobj.findOne({
    filter: {
      author_permlink: parsedBody.linkToObject,
    },
    projection: { _id: 1 },
  });
  if (!wobject) return true;
  return false;
};

const postLinkValidation = async (body) => {
  if (!body) return true;
  const [author, permlink] = body.split('/');
  if (!author || !permlink) return true;
  const { post } = await Post.findOne({ author, permlink });
  return !post;
};

const permlinkValidation = async (authorPermlink) => {
  const { wobject } = await Wobj.findOne({
    filter: {
      author_permlink: authorPermlink,
    },
  });
  return !wobject;
};

const nameOrPermlinkValidation = async (body, types = []) => {
  const object = jsonHelper.parseJson(body, null);
  if (!object) return true;
  const { error } = namePermlinkSchema.validate(object);
  if (error) return true;
  if (!object.authorPermlink) return false;
  const { wobject } = await Wobj.findOne({
    filter: {
      author_permlink: object.authorPermlink,
      object_type: {
        $in: types,
      },
    },
  });
  if (!wobject) return true;
  return false;
};

const validatePublisherField = async (body) => {
  const publisher = jsonHelper.parseJson(body, null);
  if (!publisher) return true;
  const { error } = namePermlinkSchema.validate(publisher);
  if (error) return true;
  if (!publisher.authorPermlink) return false;
  const { wobject } = await Wobj.findOne({
    filter: {
      author_permlink: publisher.authorPermlink,
      object_type: OBJECT_TYPES.BUSINESS,
    },
  });
  if (!wobject) return true;
  return false;
};

const validateAuthorsField = async (body) => {
  const authors = jsonHelper.parseJson(body, null);
  if (!authors) return true;
  const { error } = namePermlinkSchema.validate(authors);
  if (error) return true;
  if (!authors.authorPermlink) return false;

  const { wobject } = await Wobj.findOne({
    filter: {
      author_permlink: authors.authorPermlink,
      object_type: OBJECT_TYPES.PERSON,
    },
  });
  if (!wobject) return true;
  return false;
};

const validateProductId = async (body) => {
  let productId;
  try {
    productId = JSON.parse(body);
  } catch (error) {
    throw new Error(`Error on parse "${FIELDS_NAMES.PRODUCT_ID}" field: ${error}`);
  }

  if (!productId.productIdType) {
    throw new Error(`Error on "${FIELDS_NAMES.PRODUCT_ID}: product ID type is not provided"`);
  }

  if (productId.productIdImage) {
    try {
      const url = new URL(productId.productIdImage);
    } catch (e) {
      throw new Error(`Error on "${FIELDS_NAMES.PRODUCT_ID}: product ID image is not a link"`);
    }
  }

  const textMatch = `\"${productId.productId}\"}`;
  const regexMatch = new RegExp(`"productId":"${productId.productId}","productIdType":"${productId.productIdType}"`);
  const {
    result,
    error: dbError,
  } = await Wobj.findSameFieldBody(textMatch, regexMatch);
  if (dbError) throw new Error(`Error on parse "${FIELDS_NAMES.PRODUCT_ID}" field: ${dbError}`);
  if (result) throw new Error(`Error on parse "${FIELDS_NAMES.PRODUCT_ID}" field: this product id already exists`);
};

module.exports = { validate };
