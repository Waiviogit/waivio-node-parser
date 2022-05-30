const { ObjectType } = require('database').models;
const {
  OBJECT_TYPES_FOR_COMPANY,
  FIELDS_NAMES,
} = require('../../../constants/wobjectsData');
const addSearchesFields = require('../addSearchesFieldsToWobjects/addSearchesFieldsToWobjects');

exports.updateObjectTypes = async () => {
  try {
    await ObjectType.updateMany({ name: { $in: OBJECT_TYPES_FOR_COMPANY } },
      { $addToSet: { exposedFields: FIELDS_NAMES.COMPANY_ID } });
    await addSearchesFields(FIELDS_NAMES.COMPANY_ID);
  } catch (error) {
    console.log('Saving error', error);
    console.log('task completed');
  }
};
