const _ = require('lodash');
const { Wobj } = require('models');
const { appendObjectValidator } = require('validator');
const { commentRefSetter } = require('utilities/commentRefService');
const { updateSpecificFieldsHelper } = require('utilities/helpers');
const { SEARCH_FIELDS, FIELDS_NAMES } = require('constants/wobjectsData');
const { parseAddress } = require('utilities/helpers/updateSpecificFieldsHelper');

const parse = async (operation, metadata) => {
  const data = {
    author_permlink: operation.parent_permlink,
    field: {
      creator: metadata.wobj.creator,
      author: operation.author,
      permlink: operation.permlink,
    },
    search: {},
  };

  for (const fieldItem in metadata.wobj.field) {
    data.field[fieldItem] = metadata.wobj.field[fieldItem];
  }

  const fieldName = metadata.wobj.field.name;
  if (_.includes(SEARCH_FIELDS, fieldName)) {
    switch (fieldName) {
      case FIELDS_NAMES.NAME:
      case FIELDS_NAMES.EMAIL:
        data.search[fieldName] = _.get(metadata.wobj.field, 'body');
        break;
      case FIELDS_NAMES.PHONE:
        data.search[fieldName] = (_.get(metadata.wobj.field, 'number') || _.get(metadata.wobj.field, 'body'));
        break;
      case FIELDS_NAMES.ADDRESS:
        const { address, err } = parseAddress(_.get(metadata.wobj.field, 'body'));
        if (err) return { err };
        data.search[fieldName] = address;
        break;
    }
  }

  const { result, error } = await appendObject(data, operation);

  if (result) {
    console.log(`Field ${metadata.wobj.field.name}, with value: ${metadata.wobj.field.body} added to wobject ${data.author_permlink}!\n`);
    return true;
  } if (error) {
    console.error(error);
    return false;
  }
};

const appendObject = async (data, operation) => {
  try {
    await appendObjectValidator.validate(data, operation);
    await commentRefSetter.addAppendWobj(
      `${data.field.author}_${data.field.permlink}`,
      data.author_permlink,
    );
    const { result: isAddedField, error } = await Wobj.addField(data);

    let isAddedSearchField;
    if (data.search) {
      const { result, error: err } = await Wobj.addSearchField(data);
      if (error) throw err;
      isAddedSearchField = result;
    }
    await updateSpecificFieldsHelper.update(
      data.field.author, data.field.permlink, data.author_permlink,
    );
    return { result: isAddedField && isAddedSearchField };
  } catch (error) {
    return { error };
  }
};

module.exports = { parse };
