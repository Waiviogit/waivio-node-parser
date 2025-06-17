const { Wobj } = require('models');
const updateSpecificFieldsHelper = require('utilities/helpers/updateSpecificFieldsHelper');

const handleSpecifiedField = async (author, permlink, authorPermlink, voter, percent) => {
  const { field, error } = await Wobj.getField(author, permlink, authorPermlink);

  if (error || !field) return;
  await updateSpecificFieldsHelper.update({
    author, permlink, authorPermlink, voter, percent,
  });
};

module.exports = { handleSpecifiedField };
