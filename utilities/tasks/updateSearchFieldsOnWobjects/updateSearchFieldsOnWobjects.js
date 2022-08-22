const { WObject } = require('database').models;
const _ = require('lodash');
const { FIELDS_NAMES } = require('../../../constants/wobjectsData');
const { parseSearchData, createEdgeNGrams } = require('../../helpers/updateSpecificFieldsHelper');

exports.updateSearchFieldsOnWobjects = async () => {
  try {
    console.time('updateSearchFieldsOnWobjects');
    let wobjects = [];
    do {
      wobjects = await WObject.find({ processed: false }, { fields: 1, author_permlink: 1 })
        .limit(1000).lean();
      if (!wobjects.length) return;

      const wobjectsWithFields = _.filter(wobjects, (obj) => obj.fields.length);
      if (!wobjectsWithFields.length) return;

      prepareSearchFieldsToUpdate(wobjectsWithFields);
      const bulkArr = prepareDataForBulkWrite(wobjectsWithFields);
      if (!bulkArr.length) return;

      await WObject.bulkWrite(bulkArr);
    } while (wobjects.length);
    console.log('task completed successfully');
    console.timeEnd('updateSearchFieldsOnWobjects');
  } catch (error) {
    console.error(error.message);
    console.log('task completed');
    console.timeEnd('updateSearchFieldsOnWobjects');
  }
};

const prepareSearchFieldsToUpdate = (wobjects) => {
  for (const wobject of wobjects) {
    const fieldsToUpdate = _.filter(wobject.fields, (field) => _.includes([FIELDS_NAMES.NAME,
      FIELDS_NAMES.EMAIL, FIELDS_NAMES.PHONE, FIELDS_NAMES.ADDRESS, FIELDS_NAMES.CATEGORY_ITEM,
      FIELDS_NAMES.COMPANY_ID, FIELDS_NAMES.DESCRIPTION, FIELDS_NAMES.TITLE],
    field.name));
    if (!fieldsToUpdate.length) continue;

    wobject.search = addSearchFields(fieldsToUpdate, wobject.author_permlink);
  }
};

const addSearchFields = (fields, authorPermlink) => {
  const searchFieldsToAdd = [];
  searchFieldsToAdd.push(createEdgeNGrams(authorPermlink.replace(/[.%?+*|{}[\]()<>“”^'"\\\-_=!&$:]/g, ''), 'permlink'));
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
        filter: { _id: wobject._id },
        update: { $set: { search: _.uniq(wobject.search), processed: true } },
      },
    });
  }

  return bulkArr;
};
