const _ = require('lodash');

const METADATA_GUEST_MARKERS = 'userId,social'.split(',');

exports.getFromMetadataGuestInfo = async ({ metadata }) => {
  if (_.every(METADATA_GUEST_MARKERS, (m) => _.isString(_.get(metadata, `comment[${m}]`)))) {
    return _.pick(metadata.comment, METADATA_GUEST_MARKERS);
  }
};
