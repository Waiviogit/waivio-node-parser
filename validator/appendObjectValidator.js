const _ = require('lodash');
const { commentRefGetter } = require('utilities/commentRefService');
const { Wobj, ObjectType } = require('models');
const { validateUserOnBlacklist } = require('validator/userValidator');
const { validateNewsFilter, validateMap } = require('validator/specifiedFieldsValidator');

const validate = async (data, operation) => {
  if (!await validateUserOnBlacklist(operation.author) || !await validateUserOnBlacklist(_.get(data, 'field.creator'))) throw new Error("Can't append object, user in blacklist!");
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
  if (data.field.name === 'categoryItem') {
    setUniqFields.push('id');
  }
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
  switch (_.get(data, 'field.name')) {
    case 'parent':
      const { wobject: parentWobject } = await Wobj.getOne({ author_permlink: data.field.body });
      if (!parentWobject) throw new Error(`Can't append parent ${data.field.body}, wobject should exist`);
      break;
    case 'newsFilter':
      let newsFilter;
      try {
        newsFilter = JSON.parse(data.field.body);
      } catch (newsFilterParseError) {
        throw new Error(`Error on parse "newsFilter" field: ${newsFilterParseError}`);
      }
      if (!validateNewsFilter(newsFilter)) throw new Error(`Can't append newsFilter ${data.field.body}, not valid data`);
      break;
    case 'map':
      let map;
      try {
        map = JSON.parse(data.field.body);
      } catch (mapParseError) {
        throw new Error(`Error on parse "map" field: ${mapParseError}`);
      }
      if (map.latitude && map.longitude) {
        map.latitude = Number(map.latitude);
        map.longitude = Number(map.longitude);
      }
      if (!validateMap(map)) throw new Error(`Can't append newsFilter ${data.field.body}, not valid data`);
      break;
    case 'tagCategory':
      // "id" field is required
      if (!_.get(data, 'field.id')) throw new Error(`Can't append tagCategory ${data.field.body}, "id" is required`);
      // tagCategory must to be unique by id
      const { wobject: tagCategoryWobj } = await Wobj.getOne({
        author_permlink: data.author_permlink,
      });
      const existCategory = _
        .chain(tagCategoryWobj)
        .get('fields', [])
        .find({ id: data.field.id, name: 'tagCategory' })
        .value();
      if (existCategory) throw new Error(`Can't append tagCategory ${data.field.body}, category with the same "id" exists`);
      break;
    case 'categoryItem':
      // "id" field is required
      if (!_.get(data, 'field.id')) throw new Error(`Can't append categoryItem ${data.field.body}, "id" is required`);
      // the body of the categoryItem must refer ot the real hashtag wobject
      const { wobject: existTag } = await Wobj.getOne({ author_permlink: data.field.body });
      if (!existTag || existTag.object_type !== 'hashtag') throw new Error(`Can't append categoryItem ${data.field.body}, Hashtag not valid!`);

      const { wobject: categoryItemWobj } = await Wobj.getOne({
        author_permlink: data.author_permlink,
      });
      const parentCategory = _.chain(categoryItemWobj).get('fields', [])
        .find({ name: 'tagCategory', id: data.field.id }).value();
      if (!parentCategory) throw new Error(`Can't append categoryItem ${data.field.body}, "tagCategory" with the same "id" doesn't exist`);
      const existItem = _
        .chain(categoryItemWobj)
        .get('fields', [])
        .find({ name: 'categoryItem', body: data.field.body, id: data.field.id })
        .value();
      if (existItem) throw new Error(`Can't append categoryItem ${data.field.body}, item with the same "id" and "body" exist`);
      break;
  }
};

module.exports = { validate };
