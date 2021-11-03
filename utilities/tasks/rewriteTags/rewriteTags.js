const { WObject } = require('database').models;
const { redisSetter } = require('utilities/redis');
const _ = require('lodash');

module.exports = async () => {
  try {
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
    const tagCategories = new Map();

    function dataFilter(value, filter) {
      return value.name = filter;
    }

    for (const item of objects) {
      const tagsResult = item.fields.filter(dataFilter, 'categoryItem');
      for (const element of tagsResult) {
        if (/^[^*|\":<>[\]{}`\\()';@&$ -]+$/.test(element.body)) {
          tags.push({
            id: element.id,
            catItem: element.body,
            objType: item.object_type,
          });
        }
      }
    }

    for (const item of objects) {
      const tagCatResult = item.fields.filter(dataFilter, 'tagCategory');
      for (const element of tagCatResult) {
        if (/^[^*|\":<>[\]{}`\\()';@&$ --]+$/.test(element.body) || !!element.body) {
          tagCategories.set(
            element.id, element.body,
          );
        }
      }
    }
    for (const element of tags) {
      if (!!element.objType && !!element.catItem && !!element.id && !!element.id) {
        const tag = tagCategories.get(element.id);
        let addTag = [];
        addTag = _.concat(addTag, [0, tag]);
        await redisSetter.addTagCategory({
          categoryName: element.catItem,
          objectName: element.objType,
          tags: addTag,
        });
      }
    }
  } catch (error) {
    return { error };
  }
};
