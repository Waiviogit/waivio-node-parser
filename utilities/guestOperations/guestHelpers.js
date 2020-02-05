const _ = require('lodash');
const constants = require('../constants');

const METADATA_GUEST_MARKERS = 'userId,social'.split(',');

exports.validateProxyBot = (username) => constants.WAIVIO_PROXY_BOTS.includes(username);

exports.getFromMetadataGuestInfo = ({ operation, metadata }) => {
  if (this.validateProxyBot(_.get(operation, 'author')) && _.get(metadata, 'comment')) {
    if (_.every(METADATA_GUEST_MARKERS, (m) => _.isString(_.get(metadata, `comment[${m}]`)))) {
      return _.pick(metadata.comment, METADATA_GUEST_MARKERS);
    }
  }
};
