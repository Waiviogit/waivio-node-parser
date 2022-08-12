const _ = require('lodash');
const { Wobj, ObjectType } = require('models');
const { commentRefGetter } = require('utilities/commentRefService');
const { validateUserOnBlacklist } = require('validator/userValidator');
const { validateNewsFilter, validateMap } = require('validator/specifiedFieldsValidator');
const { AUTHORITY_FIELD_ENUM, FIELDS_NAMES, OBJECT_TYPES } = require('constants/wobjectsData');
const { OBJECT_TYPES_FOR_COMPANY, OBJECT_TYPES_FOR_PRODUCT } = require('../constants/wobjectsData');

const validate = async (data, operation) => {
  if (!await validateUserOnBlacklist(operation.author)
      || !await validateUserOnBlacklist(_.get(data, 'field.creator'))) {
    throw new Error("Can't append object, user in blacklist!");
  }

  validateFields(data);
  await validatePostLinks(operation);
  await validateSameFields(data);
  await validateFieldBlacklist({ author_permlink: data.author_permlink, fieldName: _.get(data, 'field.name') });
  await validateSpecifiedFields(data, operation);
};

// validate that append has all required fields
const validateFields = (data) => {
  const requiredFieldsAppendObject = 'name,body,locale,author,permlink,creator'.split(',');

  requiredFieldsAppendObject.forEach((field) => {
    if (_.isNil(data.field[field])) {
      throw new Error("Can't append object, not all required fields is filling!");
    }
  });
};

// validate that field with the same name and body don't exist already
const validateSameFields = async (data) => {
  const { wobject } = await Wobj.getOne({ author_permlink: data.author_permlink });
  const setUniqFields = ['name', 'body', 'locale'];

  if (data.field.name === FIELDS_NAMES.CATEGORY_ITEM) setUniqFields.push('id');
  if (data.field.name === FIELDS_NAMES.PHONE) setUniqFields.splice(1, 1, 'number');

  const foundedFields = _.map(wobject.fields, (field) => _.pick(field, setUniqFields));
  const result = foundedFields.find((field) => _.isEqual(field, _.pick(data.field, setUniqFields)));
  if (result) {
    throw new Error("Can't append object, the same field already exists");
  }
};

// validate that parent comment is "createObject" comment
const validatePostLinks = async (operation) => {
  const result = await commentRefGetter
    .getCommentRef(`${operation.parent_author}_${operation.parent_permlink}`);

  if (!result || !result.type || result.type !== 'create_wobj' || !result.root_wobj) {
    throw new Error("Can't append object, parent comment isn't create Object comment!");
  }

  const existResult = await commentRefGetter
    .getCommentRef(`${operation.author}_${operation.permlink}`);

  if (existResult) {
    throw new Error("Can't append object, append is now exist!");
  }
};

// validate that current field allowed in specified Object Type
const validateFieldBlacklist = async ({ author_permlink: authorPermlink, fieldName }) => {
  const { wobject, error: wobjError } = await Wobj.getOne({ author_permlink: authorPermlink });
  if (wobjError) throw new Error(wobjError);

  const { objectType, error: objTypeError } = await ObjectType.getOne({
    name: wobject.object_type,
  });
  if (objTypeError) throw new Error(objTypeError);

  if (_.get(objectType, 'updates_blacklist', []).includes(fieldName)) {
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
        .find({ id: data.field.id, name: FIELDS_NAMES.TAG_CATEGORY })
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
      const parentCategory = _.chain(categoryItemWobj).get('fields', [])
        .find({ name: FIELDS_NAMES.TAG_CATEGORY, id: data.field.id }).value();
      if (!parentCategory) {
        throw new Error(`Can't append ${FIELDS_NAMES.CATEGORY_ITEM} 
        ${data.field.body}, "${FIELDS_NAMES.TAG_CATEGORY}" with the same "id" doesn't exist`);
      }
      const existItem = _
        .chain(categoryItemWobj)
        .get('fields', [])
        .find({ name: 'categoryItem', body: data.field.body, id: data.field.id })
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
        data.field.author, data.field.permlink, data.author_permlink, {
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
      const objectTypeNotCorresponding = !(_.includes(OBJECT_TYPES_FOR_COMPANY, companyObject.object_type)
              && fieldName === FIELDS_NAMES.COMPANY_ID)
          && !(_.includes(OBJECT_TYPES_FOR_PRODUCT, companyObject.object_type)
              && (fieldName === FIELDS_NAMES.PRODUCT_ID || fieldName === FIELDS_NAMES.GROUP_ID));
      if (objectTypeNotCorresponding) {
        throw new Error(`Can't append ${fieldName} as the object type is not corresponding`);
      }
      if (fieldName === FIELDS_NAMES.PRODUCT_ID) await validateProductId(data.field.body);
      break;
  }
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
  const { result, error: dbError } = await Wobj.findSameFieldBody(textMatch, regexMatch);
  if (dbError) throw new Error(`Error on parse "${FIELDS_NAMES.PRODUCT_ID}" field: ${dbError}`);
  if (result) throw new Error(`Error on parse "${FIELDS_NAMES.PRODUCT_ID}" field: this product id already exists`);
};

module.exports = { validate };
