const permlinkGenerator = require('utilities/restaurantTagsParser/permlinkGenerator');
const { OBJECT_TYPES, CREATE_TAGS_ON_UPDATE_TYPES } = require('constants/wobjectsData');
const { importUpdates } = require('utilities/objectImportServiceApi');
const { Wobj, ObjectType, App } = require('models');
const config = require('config');
const crypto = require('node:crypto');
const _ = require('lodash');

/*
THIS MODULE PARSE TAGS FROM FIELDS BODY AND SEND TO IMPORT SERVICE
 */

const createTags = async ({ field, authorPermlink }) => {
  const locale = _.get(field, 'locale');
  if (locale !== 'en-US') return;

  const { wobject } = await Wobj.getOne({ author_permlink: authorPermlink });
  if (!wobject || !_.find(wobject.fields, (obj) => obj.name === 'name')) return 0;
  if (!_.includes(CREATE_TAGS_ON_UPDATE_TYPES, wobject.object_type)) return 0;
  const { objectType } = await ObjectType.getOne({ name: wobject.object_type });
  const tagCategories = _.find(objectType.supposed_updates, (update) => update.name === 'tagCategory');
  const { result: app } = await App.findOne({ host: config.appHost });
  if (!objectType || !tagCategories || !app) return;
  let appends = [];

  switch (wobject.object_type) {
    case OBJECT_TYPES.RESTAURANT:
    case OBJECT_TYPES.DRINK:
    case OBJECT_TYPES.DISH:
      for (const tag of tagCategories.values) {
        const tagCategory = _.find(
          wobject.fields,
          (obj) => obj.name === 'tagCategory' && obj.body === tag,
        );

        appends = _.concat(appends, parseIngredients({
          string: field.body,
          authorPermlink,
          fields: wobject.fields,
          id: tagCategory ? tagCategory.id : null,
          tag,
          tagsSource: app.tagsData[tag],
        }));
      }
      break;
    default:
      return;
  }
  if (appends.length) {
    await importUpdates.send([{
      object_type: wobject.object_type,
      author_permlink: authorPermlink,
      fields: appends,
    }]);
  }
  return appends.length;
};

const createTag = ({
  body, authorPermlink, name, id, tag,
}) => {
  const field = {
    name,
    body,
    id: id || crypto.randomUUID(),
    permlink: permlinkGenerator.getPermlink(authorPermlink, id ? 'category-item' : 'tag-category'),
    locale: 'en-US',
    creator: 'asd09',
  };
  if (id) field.tagCategory = tag;
  return field;
};

const parseIngredients = ({
  string, fields, id, authorPermlink, tag, tagsSource,
}) => {
  const appends = [];
  let newId;
  if (!id) newId = crypto.randomUUID();

  try {
    _.forEach(Object.keys(tagsSource), (key) => {
      const regexp = new RegExp(`\\b(${key.toLowerCase()})\\b`, 'g');
      if ((regexp.test(string.toString().toLowerCase()))
          && !_.find(
            fields,
            (field) => field.name === 'categoryItem' && field.body === tagsSource[key],
          )) {
        appends.push(createTag({
          name: 'categoryItem', body: tagsSource[key], id: id || newId, authorPermlink, tag,
        }));
      }
    });
  } catch (error) {
    return [];
  }
  if (appends.length && !id) {
    const tagCategory = createTag({
      name: 'tagCategory', body: tag, authorPermlink, id: newId,
    });
    appends.unshift(tagCategory);
  }

  return appends;
};

module.exports = { createTags };
