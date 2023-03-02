const { WObject } = require('database').models;
const {
  FIELDS_NAMES,
  OBJECT_TYPES,
} = require('constants/wobjectsData');
const jsonHelper = require('utilities/helpers/jsonHelper');
const formatHelper = require('utilities/helpers/formatHelper');
const _ = require('lodash');

const findNotProcessedObject = async () => {
  try {
    return {
      result: await WObject.find({
        fields: {
          $elemMatch: {
            name: FIELDS_NAMES.OPTIONS,
          },
        },
        object_type: { $in: [OBJECT_TYPES.PRODUCT, OBJECT_TYPES.BOOK] },
      },
      {
        fields: 1,
        author_permlink: 1,
      })
        .lean(),
    };
  } catch (error) {
    return { error };
  }
};

const updateOptionsBody = async ({
  authorPermlink,
  fieldId,
  body,
}) => {
  try {
    return {
      result: await WObject.updateOne(
        {
          author_permlink: authorPermlink,
          'fields._id': fieldId,
        },
        {
          $set: { 'fields.$.body': body },
        },
      ),
    };
  } catch (error) {
    return { error };
  }
};

const updateOptions = async ({
  options,
  authorPermlink,
}) => {
  for (const option of options) {
    const optionsBody = jsonHelper.parseJson(option.body, null);
    if (!optionsBody) continue;
    optionsBody.category = formatHelper.capitalizeEachWord(optionsBody.category);
    await updateOptionsBody({
      authorPermlink,
      fieldId: option._id,
      body: JSON.stringify(optionsBody),
    });
  }
};

const capitalizeOptionsCategory = async () => {
  const {
    result: wobjects,
    error,
  } = await findNotProcessedObject();
  if (error) {
    return;
  }
  for (const wobject of wobjects) {
    const options = _.filter(wobject.fields, (f) => f.name === FIELDS_NAMES.OPTIONS);
    await updateOptions({
      options,
      authorPermlink: wobject.author_permlink,
    });
  }

  console.log('taskFinished');
};

module.exports = capitalizeOptionsCategory;
