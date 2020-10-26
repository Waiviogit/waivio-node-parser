const config = require('config');
const { WObject, App } = require('database').models;
const { FIELDS_NAMES } = require('constants/wobjectsData');
const { validateMap } = require('validator/specifiedFieldsValidator');
const { processWobjects } = require('utilities/helpers/wobjectHelper');
const { parseMap } = require('utilities/helpers/updateSpecificFieldsHelper');

module.exports = async () => {
  const wobjects = await WObject.aggregate([
    { $match: { parent: { $ne: '' }, 'fields.name': { $ne: 'map' } } },
    { $group: { _id: '$parent', children: { $push: '$author_permlink' } } },
  ]);

  const app = await App.findOne({ host: config.appHost }).lean();

  for (const wobject of wobjects) {
    const parent = await WObject.findOne({ author_permlink: wobject._id }).lean();
    if (!parent) continue;
    const { map } = await processWobjects({
      wobjects: [parent], app, fields: [FIELDS_NAMES.MAP], returnArray: false,
    });
    if (map) {
      const parsedMap = parseMap(map);
      if (validateMap(parsedMap)) {
        await WObject.updateMany(
          { author_permlink: { $in: wobject.children } },
          { map: { type: 'Point', coordinates: [parsedMap.longitude, parsedMap.latitude] } },
        );
      }
    }
  }
  console.log('set map completed');
};
