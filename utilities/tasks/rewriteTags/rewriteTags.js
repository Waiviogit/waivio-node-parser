const { WObject, ObjectType } = require('database').models;
const { redisSetter } = require('utilities/redis');
const _ = require('lodash');

module.exports = async () => {
  try {
    const objectTypes = await ObjectType.aggregate([
      {
        $project: {
          supposed_updates: 1,
          name: 1,
        },
      },
    ]);

    const objects = await WObject.aggregate([
      { $match: { 'fields.name': 'categoryItem' } },
      {
        $project: {
          fields: 1,
          object_type: 1,
        },
      },
    ]);

    const tags = [];

    const map1 = new Map();

    for (const element of objectTypes) {
      const types = _.filter(element.supposed_updates, (el) => el.name === 'tagCategory');
      if (types.length > 0) {
        map1.set(
          element.name, types[0].values,
        );
      }
    }

    for (const item of objects) {
      const typesInfo = map1.get(item.object_type);
      const tagsResult = _.filter(item.fields, (el) => el.name === 'categoryItem');
      const tagCategory = _.filter(item.fields, (el) => el.name === 'tagCategory');
      for (const element of tagsResult) {
        const category = _.find(tagCategory, (el) => el.id === element.id);
        if (!category) continue;
        const tag = _.find(tags, (el) => el.category === category.body && el.name === element.body && el.objType === item.object_type && typesInfo.includes(el.category));
        tag
          ? tag.score += 1
          : tags.push({
            score: 0,
            name: element.body,
            objType: item.object_type,
            category: category.body,
          });
      }
    }

    for (const element of tags) {
      if (!!element.objType && !!element.name && !!element.category) {
        let addTag = [];
        addTag = _.concat(addTag, [element.score, element.name]);
        await redisSetter.addTagCategory({
          categoryName: element.category,
          objectType: element.objType,
          tags: addTag,
        });
      }
    }
  } catch (error) {
    return { error };
  }
};
