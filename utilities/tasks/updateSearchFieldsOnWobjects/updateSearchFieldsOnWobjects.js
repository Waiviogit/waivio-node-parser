const { WObject } = require('database').models;
const _ = require('lodash');
const { ObjectId } = require('bson');
const { FIELDS_NAMES } = require('../../../constants/wobjectsData');
const { parseSearchData } = require('../../helpers/updateSpecificFieldsHelper');

exports.updateSearchFieldsOnWobjects = async () => {
  try {
    console.time('updateSearchFieldsOnWobjects');
    await WObject.updateMany({ $unset: { search: '' } });
    const wobjects = await WObject.find({ processed: false }, { fields: 1 }, {}).lean();
    if (!wobjects.length) return;

    const wobjectsWithFields = _.filter(wobjects, (obj) => obj.fields.length);
    prepareSearchFieldsToUpdate(wobjectsWithFields);
    const bulkArr = prepareDataForBulkWrite(wobjectsWithFields);
    if (bulkArr.length) await WObject.bulkWrite(bulkArr);
    console.log('task completed successfully');
    console.timeEnd('updateSearchFieldsOnWobjects');
  } catch (error) {
    console.error(error);
    console.log('task completed');
    console.timeEnd('updateSearchFieldsOnWobjects');
  }
};

const prepareSearchFieldsToUpdate = (wobjects) => {
  for (const wobject of wobjects) {
    const fieldsToUpdate = _.filter(wobject.fields, (field) => _.includes([FIELDS_NAMES.NAME,
      FIELDS_NAMES.EMAIL, FIELDS_NAMES.PHONE, FIELDS_NAMES.ADDRESS, FIELDS_NAMES.CATEGORY_ITEM, FIELDS_NAMES.COMPANY_ID],
    field.name));
    if (!fieldsToUpdate.length) continue;

    wobject.search = addSearchFields(fieldsToUpdate);
  }
};

const addSearchFields = (fields) => {
  const searchFieldsToAdd = [];
  const metadataArray = _.map(fields, (field) => ({
    wobj: {
      field: {
        name: field.name,
        body: field.body,
        ...field.name === FIELDS_NAMES.PHONE && { number: field.number },
      },
    },
  }));
  for (const field of metadataArray) {
    try {
      searchFieldsToAdd.push(...parseSearchData(field));
    } catch (error) {
      const indexOfErrorElement = _.indexOf(metadataArray, field);
      metadataArray.splice(indexOfErrorElement, 1);
    }
  }

  return searchFieldsToAdd;
};

const prepareDataForBulkWrite = (wobjects) => {
  const bulkArr = [];
  for (const wobject of wobjects) {
    bulkArr.push({
      updateOne: {
        filter: { _id: ObjectId(wobject._id) },
        update: { $set: { search: _.uniq(wobject.search), processed: true } },
      },
    });
  }

  return bulkArr;
};
