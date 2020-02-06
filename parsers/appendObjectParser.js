const { Wobj } = require('models');
const { appendObjectValidator } = require('validator');
const { commentRefSetter } = require('utilities/commentRefService');
const { updateSpecificFieldsHelper } = require('utilities/helpers');

const parse = async (operation, metadata) => {
  const data = {
    author_permlink: operation.parent_permlink,
    field: {
      creator: metadata.wobj.creator,
      author: operation.author,
      permlink: operation.permlink,
    },
  };

  for (const fieldItem in metadata.wobj.field) {
    data.field[fieldItem] = metadata.wobj.field[fieldItem];
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
    const { result, error } = await Wobj.addField(data);

    if (error) {
      throw error;
    }
    await updateSpecificFieldsHelper.update(
      data.field.author, data.field.permlink, data.author_permlink,
    );

    return { result };
  } catch (error) {
    return { error };
  }
};

module.exports = { parse };
