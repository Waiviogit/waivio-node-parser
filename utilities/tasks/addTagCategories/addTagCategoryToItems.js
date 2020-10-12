const _ = require('lodash');
const { FIELDS_NAMES } = require('constants/wobjectsData');
const { WObject } = require('database').models;

module.exports = async () => {
  const result = await WObject.find({ 'fields.name': FIELDS_NAMES.CATEGORY_ITEM }).lean();

  for (const wobj of result) {
    wobj.fields.map((field) => {
      if (field.name !== FIELDS_NAMES.CATEGORY_ITEM) return;
      const tagCategory = _.find(wobj.fields, { name: FIELDS_NAMES.TAG_CATEGORY, id: field.id });
      if (!tagCategory) {
        console.error(wobj.author_permlink);
        return;
      }
      field.tagCategory = tagCategory.body;
    });
    await WObject.updateOne({ _id: wobj._id }, { $set: { fields: wobj.fields } });
  }
};
