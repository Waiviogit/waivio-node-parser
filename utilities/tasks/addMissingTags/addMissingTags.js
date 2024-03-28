const { createTags } = require('utilities/restaurantTagsParser/tagsParser');
const { FIELDS_NAMES } = require('constants/wobjectsData');
const sleep = require('node:util').promisify(setTimeout);
const { Wobj } = require('models');
const _ = require('lodash');

module.exports = async (type) => {
  const filter = {
    object_type: type,
    fields: {
      $elemMatch: {
        $or: [
          { name: FIELDS_NAMES.NAME },
          { name: FIELDS_NAMES.TITLE },
          { name: FIELDS_NAMES.DESCRIPTION },
        ],
      },
    },
  };
  const { result } = await Wobj.find(filter, { author_permlink: 1, fields: 1 });
  for (const resultElement of result) {
    const body = _.reduce(resultElement.fields, (acc, el) => {
      if (_.includes([FIELDS_NAMES.NAME, FIELDS_NAMES.TITLE, FIELDS_NAMES.DESCRIPTION], el.name)) {
        acc += `${el.body} `;
      }
      return acc;
    }, '');
    const countAdded = await createTags(
      { field: { body }, authorPermlink: resultElement.author_permlink },
    );
    console.log('added tags:', countAdded);
    await sleep(countAdded * 3000);
  }
  console.log('-------------- Add missing tags task completed --------------');
};
