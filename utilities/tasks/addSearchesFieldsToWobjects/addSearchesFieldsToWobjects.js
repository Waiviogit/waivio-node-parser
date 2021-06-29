const _ = require('lodash');
const { updateSpecificFieldsHelper } = require('utilities/helpers');
const { FIELDS_NAMES } = require('constants/wobjectsData');
const { WObject } = require('database').models;

module.exports = async (fieldName) => {
  if (fieldName === 'author_permlink') return getAuthorPermlinks();
  const wobjects = await WObject.find({ 'fields.name': fieldName }, { author_permlink: 1, fields: 1 }).lean();
  for (const wobj of wobjects) {
    const { newFields, err } = await getFieldsData(wobj.fields, fieldName);
    if (err) {
      console.error(`Failed to parse the address for the object: ${wobj.author_permlink} with error:`, err);
      continue;
    }
    await WObject.updateOne({ _id: wobj._id }, { $set: { [`search.${fieldName}`]: newFields } });
  }
};

const getFieldsData = async (fields, fieldNameForParse) => {
  try {
    return {
      newFields: _.chain(fields)
        .filter((field) => field.name === fieldNameForParse)
        .map((field) => parseSearchField(field)).value(),
    };
  } catch (err) {
    return { err };
  }
};

const parseSearchField = (field) => {
  const parseSearchData = {
    [FIELDS_NAMES.NAME]: () => _.get(field, 'body'),
    [FIELDS_NAMES.EMAIL]: () => _.get(field, 'body'),
    [FIELDS_NAMES.PHONE]: () => _.get(field, 'number') || _.get(field, 'body'),
    [FIELDS_NAMES.ADDRESS]: () => updateSpecificFieldsHelper.parseAddress(_.get(field, 'body')),
  };
  return parseSearchData[field.name]();
};

const getAuthorPermlinks = async () => {
  const wobjects = await WObject.find({}, { author_permlink: 1 });
  for (const wobj of wobjects) {
    await WObject.updateOne({ _id: wobj._id }, { $set: { 'search.author_permlink': wobj.author_permlink } });
  }
};
