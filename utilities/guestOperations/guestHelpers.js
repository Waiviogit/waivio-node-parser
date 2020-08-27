const _ = require('lodash');
const appHelper = require('utilities/helpers/appHelper');

const METADATA_GUEST_MARKERS = 'userId,social'.split(',');

exports.validateProxyBot = async (username) => {
  const WAIVIO_PROXY_BOTS = await appHelper.getProxyBots(['proxyBot', 'reviewBot']);
  return WAIVIO_PROXY_BOTS.includes(username);
};

exports.getFromMetadataGuestInfo = async ({ operation, metadata }) => {
  if (await this.validateProxyBot(_.get(operation, 'author')) && _.get(metadata, 'comment')) {
    if (_.every(METADATA_GUEST_MARKERS, (m) => _.isString(_.get(metadata, `comment[${m}]`)))) {
      return _.pick(metadata.comment, METADATA_GUEST_MARKERS);
    }
  }
};
