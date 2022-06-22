const { WObject } = require('database').models;
const _ = require('lodash');
const { ObjectId } = require('bson');
const { FIELDS_NAMES } = require('../../../constants/wobjectsData');
const { parseSearchData } = require('../../helpers/updateSpecificFieldsHelper');

exports.updateSearchFieldsOnWobjects = async () => {
  try {
    const wobjects = await WObject.find({
      'fields.name': {
        $in: [FIELDS_NAMES.NAME, FIELDS_NAMES.EMAIL, FIELDS_NAMES.PHONE, FIELDS_NAMES.ADDRESS,
          FIELDS_NAMES.CATEGORY_ITEM, FIELDS_NAMES.COMPANY_ID],
      },
    }, { search: 1, fields: 1 }, {}).lean();
    if (!wobjects.length) return;

    prepareSearchFieldsToUpdate(wobjects);
    const bulkArr = [];
    prepareDataForBulkWrite(wobjects, bulkArr);
    if (bulkArr.length) await WObject.bulkWrite(bulkArr);
    console.log('task completed');
  } catch (error) {
    console.error(error);
    console.log('task completed');
  }
};

const prepareSearchFieldsToUpdate = (wobjects) => {
  for (const wobject of wobjects) {
    const fieldsToUpdate = _.filter(wobject.fields, (field) => _.includes([FIELDS_NAMES.NAME,
      FIELDS_NAMES.EMAIL, FIELDS_NAMES.PHONE, FIELDS_NAMES.ADDRESS, FIELDS_NAMES.CATEGORY_ITEM, FIELDS_NAMES.COMPANY_ID],
    field.name));
    if (!fieldsToUpdate.length) return;

    // ТЕЛЕФОН МОЖЕТ БЫТЬ И В БАДИ, И ПОЛЕ НАМБЕР!!! СДЕЛАТЬ ГЕГ БАДИ ЕСЛИ ОНО НЕ ПУСТОЕ, ЗАТЕМ - НАМБЕР. ДОКИНУТЬ ПОЛЕ НАМБЕР РУКАМИ
    const parsedFields = _.filter(_.flatten(_.map(fieldsToUpdate, (field) => {
      try {
        if (_.includes(field.body, '":"')) return Object.values(JSON.parse(field.body));
        if (field.name === FIELDS_NAMES.PHONE) {
          return _.get(field, 'number') || _.get(field, 'body');
        }

        return _.get(field, 'body');
      } catch (error) {
        const indexOfErrorElement = _.indexOf(fieldsToUpdate, field);
        fieldsToUpdate.splice(indexOfErrorElement, 1);
      }
    })), (parsed) => !!parsed);

    const searchFieldsToRemove = _.filter(wobject.search, (el) => _.some(parsedFields,
      (field) => _.includes(field, el)));
    const updatedSearchFields = _.filter(wobject.search, (el) => !_.some(searchFieldsToRemove,
      (field) => _.includes(field, el)));
    wobject.search = updatedSearchFields;
    addSearchFields(fieldsToUpdate, wobject.search);
  }
};

const addSearchFields = (fields, searchFields) => {
  const searchFieldsToAdd = [];
  for (const field of fields) searchFieldsToAdd.push(...parseSearchData(field));
  searchFields.push(...searchFieldsToAdd);
};

const prepareDataForBulkWrite = (wobjects, bulkArr) => {
  for (const wobject of wobjects) {
    bulkArr.push({
      updateOne: {
        filter: { _id: ObjectId(wobject._id) },
        update: { search: wobject.search },
      },
    });
  }
};
