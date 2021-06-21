const _ = require('lodash');
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
  const newFields = [];
  for (const field of fields) {
    // conditional for parse only necessary field
    if (field.name !== fieldNameForParse) continue;
    switch (field.name) {
      case FIELDS_NAMES.NAME:
      case FIELDS_NAMES.EMAIL:
        newFields.push(_.get(field, 'body'));
        break;
      case FIELDS_NAMES.PHONE:
        newFields.push(_.get(field, 'number') || _.get(field, 'body'));
        break;
      case FIELDS_NAMES.ADDRESS:
        const { address, err } = parseAddress(_.get(field, 'body'));
        if (err) return { err };
        newFields.push(address);
        break;
    }
  }
  return newFields;
};

const getAuthorPermlinks = async () => {
  const wobjects = await WObject.find({}, { author_permlink: 1 });
  for (const wobj of wobjects) {
    await WObject.updateOne({ _id: wobj._id }, { $set: { 'search.author_permlink': wobj.author_permlink } });
  }
};

const parseAddress = (addressFromDB) => {
  let rawAddress;
  try {
    rawAddress = JSON.parse(addressFromDB);
  } catch (err) {
    return { err };
  }
  let address = '';
  for (const key in rawAddress) {
    address += `${rawAddress[key]},`;
  }
  return { address: address.substr(0, address.length - 1) };
};
