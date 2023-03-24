const { FIELDS_NAMES, OBJECT_TYPES } = require('constants/wobjectsData');
const { WObject } = require('database').models;
const jsonHelper = require('utilities/helpers/jsonHelper');
const _ = require('lodash');

const fieldsCanBeInSortCustom = [
  FIELDS_NAMES.FORM,
  FIELDS_NAMES.BUTTON,
  FIELDS_NAMES.LIST_ITEM,
  FIELDS_NAMES.NEWS_FILTER,
  FIELDS_NAMES.BLOG,
  FIELDS_NAMES.PAGE,
];

module.exports = async () => {
  try {
    const objects = await WObject.find(
      { 'fields.name': FIELDS_NAMES.SORT_CUSTOM },
      { fields: 1, author_permlink: 1 },
    ).lean();

    for (const object of objects) {
      for (const field of object.fields) {
        if (field.name !== FIELDS_NAMES.SORT_CUSTOM) continue;
        const oldSort = jsonHelper.parseJson(field.body, null);
        if (!oldSort) continue;
        if (oldSort.include) continue;

        const filterFunction = (f) => f._id < field._id
          && _.includes(fieldsCanBeInSortCustom, f.name)
          && !_.includes(
            oldSort,
            f.name === FIELDS_NAMES.LIST_ITEM ? f.body : f.permlink,
          );
        const filter = object.object_type === OBJECT_TYPES.LIST
          ? _.chain(object.fields)
            .filter(filterFunction)
            .map((f) => (f.name === FIELDS_NAMES.LIST_ITEM ? f.body : f.permlink))
            .value()
          : [];

        const newBody = JSON.stringify({
          include: oldSort,
          exclude: object.object_type === OBJECT_TYPES.LIST ? filter : [],
        });

        await WObject.updateOne({
          fields: {
            $elemMatch: {
              _id: field._id,
            },
          },
        },
        {
          'fields.$.body': newBody,
        });
      }
    }
    console.log('task finished');
  } catch (error) {
    console.error(error.message);
  }
};
