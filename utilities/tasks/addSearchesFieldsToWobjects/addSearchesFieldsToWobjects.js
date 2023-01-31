const _ = require('lodash');
const { WObject } = require('database').models;
const { parseSearchData, addSearchField } = require('utilities/helpers/updateSpecificFieldsHelper');

module.exports = async (fieldName) => {
  if (fieldName === 'author_permlink') return getAuthorPermlinks();
  const wobjects = await WObject.find({ 'fields.name': fieldName }, { author_permlink: 1, fields: 1 }).lean();
  for (const wobj of wobjects) {
    const { newFields, err } = await getFieldsData(wobj.fields, fieldName);
    if (err) {
      console.error(`Failed to parse the address for the object: ${wobj.author_permlink} with error:`, err);
      continue;
    }

    await addSearchField({
      authorPermlink: wobj.author_permlink,
      newWords: _.flatten(newFields),
    });
  }
  console.log(`${fieldName} added to search`);
};

const getFieldsData = async (fields, fieldNameForParse) => {
  try {
    return {
      newFields: _.chain(fields)
        .filter((field) => field.name === fieldNameForParse)
        .map((field) => parseSearchData(field)).value(),
    };
  } catch (err) {
    return { err };
  }
};

const getAuthorPermlinks = async () => {
  const wobjects = await WObject.find({}, { author_permlink: 1 });
  for (const wobj of wobjects) {
    await WObject.updateOne({ _id: wobj._id }, { $addToSet: { search: wobj.author_permlink } });
  }
};
