const uuid = require('uuid');
const _ = require('lodash');
const config = require('config');
const permlinkGenerator = require('utilities/restaurantTagsParser/permlinkGenerator');
const { importUpdates } = require('utilities/objectImportServiceApi');
const { Wobj, ObjectType, App } = require('models');

/*
THIS MODULE PARSE TAGS FROM FIELDS BODY AND SEND TO IMPORT SERVICE
 */

const createTags = async ({ field, authorPermlink }) => {
  const { wobject } = await Wobj.getOne({ author_permlink: authorPermlink });
  if (!wobject || !_.find(wobject.fields, (obj) => obj.name === 'name')) return;
  const { objectType } = await ObjectType.getOne({ name: wobject.object_type });
  const tagCategories = _.find(objectType.supposed_updates, (update) => update.name === 'tagCategory');
  const { app } = await App.getOne({ name: config.app });
  if (!objectType || !tagCategories || !app) return;
  let appends = [];

  switch (wobject.object_type) {
    case 'restaurant':
    case 'dish':
      for (const tag of tagCategories.values) {
        const tagCategory = _.find(wobject.fields,
          (obj) => obj.name === 'tagCategory' && obj.body === tag);

        appends = _.concat(appends, parseIngredients(
          {
            string: field.body,
            authorPermlink,
            fields: wobject.fields,
            id: tagCategory ? tagCategory.id : null,
            tag,
            tagsSource: app.tagsData[tag],
          },
        ));
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
};

const createTag = ({
  body, authorPermlink, name, id,
}) => ({
  name,
  body,
  id: id || uuid.v1(),
  permlink: permlinkGenerator.getPermlink(authorPermlink, id ? 'category-item' : 'tag-category'),
  locale: 'en-US',
  creator: 'asd09',
});

const parseIngredients = ({
  string, fields, id, authorPermlink, tag, tagsSource,
}) => {
  const appends = [];
  if (!id) {
    const tagCategory = createTag({ name: 'tagCategory', body: tag, authorPermlink });
    appends.push(tagCategory);
    id = tagCategory.id;
  }
  _.forEach(Object.keys(tagsSource), (key) => {
    const regexp = new RegExp(`\\b(${key})\\b`, 'g');
    if ((regexp.test(string.toString().toLowerCase()))
        && !_.find(fields,
          (field) => field.name === 'categoryItem' && field.body === tagsSource[key])) {
      appends.push(createTag({
        name: 'categoryItem', body: tagsSource[key], id, authorPermlink,
      }));
    }
  });
  return appends;
};


module.exports = { createTags };
