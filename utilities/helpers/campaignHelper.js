const _ = require('lodash');
const { Campaign } = require('models');
const notificationsUtil = require('utilities/notificationsApi/notificationsUtil');

exports.parseReservationConversation = async (operation) => {
  const { result: campaign } = await Campaign
    .findOne({ users: { $elemMatch: { permlink: operation.parent_permlink } } });
  if (campaign) {
    await Campaign.updateOne({ users: { $elemMatch: { permlink: operation.parent_permlink } } },
      { $inc: { 'users.$.children': 1 } });

    const reservedUser = _.find(_.get(campaign, 'users'), (u) => u.name === operation.author);

    if (reservedUser) {
      operation.guideName = _.get(campaign, 'guideName', '');
      if (!operation.guideName) return true;
      await notificationsUtil.custom(Object.assign(operation, { id: 'campaignMessage' }));
      return false;
    }
  }
  return true;
};
