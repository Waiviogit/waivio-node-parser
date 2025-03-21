const _ = require('lodash');
const { Wobj } = require('models');
const { OBJECT_TYPES } = require('constants/wobjectsData');
const { importTags } = require('utilities/objectImportServiceApi');
const config = require('config');

const wobjectsByTags = async (tags) => {
  const wobjects = [];
  const tagsImport = [];

  if (tags && Array.isArray(tags)) {
    for (const tag of _.compact(tags)) {
      if (typeof tag !== 'string') {
        continue;
      }
      const notValidChars = tag.match(/[^a-z0-9\-]+/g); // skip not valid tags

      if (!_.isEmpty(notValidChars)) {
        continue;
      }

      const { wobject } = await Wobj.getOne({ author_permlink: tag, object_type: 'hashtag' });

      if (wobject) {
        wobjects.push({
          author_permlink: wobject.author_permlink,
          percent: _.floor(100 / tags.length, 3),
          tagged: tag,
          object_type: OBJECT_TYPES.HASHTAG,
        });
      } else {
        wobjects.push({
          author_permlink: tag,
          percent: _.floor(100 / tags.length, 3),
          tagged: tag,
          object_type: OBJECT_TYPES.HASHTAG,
        });
        tagsImport.push(tag);
      }
    }
  }
  if (tagsImport.length && config.dynamicHashtags) {
    await importTags.send(tagsImport);
  }
  return wobjects;
};

const getWobjectsFromMetadata = async ({ metadata } = {}) => {
  let wobjects = _.get(metadata, 'wobj.wobjects', []);

  if (_.isEmpty(wobjects)) {
    wobjects = await wobjectsByTags(_.get(metadata, 'tags'));
  } else {
    _.forEach(
      _.get(metadata, 'tags', []),
      (tag) => {
        if (!_.includes(_.map(wobjects, 'author_permlink'), tag)) wobjects.push({ author_permlink: tag, percent: 0 });
      },
    );
  }
  return wobjects;
};

module.exports = { wobjectsByTags, getWobjectsFromMetadata };
