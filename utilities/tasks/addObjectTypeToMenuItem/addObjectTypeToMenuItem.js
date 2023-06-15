const { WObject } = require('database').models;
const { FIELDS_NAMES } = require('constants/wobjectsData');
const jsonHelper = require('utilities/helpers/jsonHelper');

const addObjectTypeToMenuItem = async () => {
  const objects = await WObject.find({ 'fields.name': 'menuItem' }, { fields: 1, author_permlink: 1 }).lean();

  for (const object of objects) {
    const fields = object.fields.filter((f) => f.name === FIELDS_NAMES.MENU_ITEM);
    for (const field of fields) {
      const body = jsonHelper.parseJson(field.body, null);
      if (!body) continue;
      if (!body.linkToObject) continue;
      const menuObject = await WObject.findOne({ author_permlink: body.linkToObject }).lean();
      if (!menuObject) continue;
      const newBody = JSON.stringify({
        ...body,
        objectType: menuObject.object_type,
      });
      await WObject.updateOne(
        {
          fields: {
            $elemMatch: {
              _id: field._id,
            },
          },
        },
        {
          'fields.$.body': newBody,
        },
      );
    }
  }
};

module.exports = addObjectTypeToMenuItem;
