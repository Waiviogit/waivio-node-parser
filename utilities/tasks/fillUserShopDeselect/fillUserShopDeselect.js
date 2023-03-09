const config = require('config');
const { FIELDS_NAMES, OBJECT_TYPES } = require('constants/wobjectsData');
const { processWobjects } = require('utilities/helpers/wobjectHelper');
const { App, WObject, UserShopDeselect } = require('database').models;
const _ = require('lodash');

const getObjects = async () => {
  try {
    const objects = await WObject.find(
      {
        object_type: { $in: [OBJECT_TYPES.PRODUCT, OBJECT_TYPES.BOOK] },
        'fields.name': FIELDS_NAMES.AUTHORITY,
      },
      {
        fields: 1,
        author_permlink: 1,
      },
    ).lean();
    return { result: objects };
  } catch (error) {
    return { error };
  }
};

const createDeselectRecord = async ({ userName, authorPermlink }) => {
  try {
    const result = await UserShopDeselect.create({ userName, authorPermlink });
    return { result };
  } catch (error) {
    return { error };
  }
};

const processAuthorities = async ({ app, wobject }) => {
  const authoritiesFields = _.filter(wobject.fields, (f) => f.name === FIELDS_NAMES.AUTHORITY);
  const processed = await processWobjects({
    wobjects: [wobject], app, fields: [FIELDS_NAMES.AUTHORITY], returnArray: false,
  });

  for (const authority of authoritiesFields) {
    const notRejected = _.find(
      processed[FIELDS_NAMES.AUTHORITY],
      (a) => a.creator === authority.creator,
    );
    if (notRejected) continue;
    await createDeselectRecord({
      userName: authority.creator,
      authorPermlink: wobject.author_permlink,
    });
  }
};

const fillUserShopDeselect = async () => {
  const { result, error } = await getObjects();
  if (error) {
    console.error(error.message);
    return;
  }
  const app = await App.findOne({ host: config.appHost }).lean();

  for (const wobject of result) {
    await processAuthorities({ app, wobject });
  }
  console.log('task finished');
};

module.exports = fillUserShopDeselect;
