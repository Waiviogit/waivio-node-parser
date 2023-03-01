const { App, WObject } = require('database').models;
const _ = require('lodash');
const { OBJECT_TYPES_FOR_GROUP_ID, FIELDS_NAMES } = require('constants/wobjectsData');
const { removeFromDepartments } = require('utilities/helpers/updateSpecificFieldsHelper');
const config = require('config');

const processObject = async ({ _id, app }) => {
  try {
    const wobject = await WObject.findOne({ _id }).lean();
    if (_.isEmpty(wobject.departments)) return;

    for (const department of wobject.departments) {
      const related = _.filter(
        wobject.fields,
        (f) => f.name === FIELDS_NAMES.DEPARTMENTS && f.body !== department,
      );
      const relatedNames = _.map(related, 'body');
      await removeFromDepartments({
        authorPermlink: wobject.author_permlink,
        department,
        relatedNames,
        app,
        wobject,
      });
    }
  } catch (error) {
    console.error(error.message);
  }
};

const pullDepartments = async () => {
  try {
    const objects = await WObject.find(
      {
        object_type: { $in: OBJECT_TYPES_FOR_GROUP_ID },
        departments: { $ne: [], $exists: true },
      },
      {
        _id: 1,
      },
    ).lean();

    const app = await App.findOne({ host: config.appHost }).lean();

    for (const object of objects) {
      await processObject({ _id: object._id, app });
    }
    console.log('Task finished');
  } catch (error) {
    console.error(error.message);
  }
};

module.exports = pullDepartments;
