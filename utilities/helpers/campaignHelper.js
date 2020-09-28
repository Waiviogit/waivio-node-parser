const _ = require('lodash');
const { Campaign } = require('models');
const notificationsUtil = require('utilities/notificationsApi/notificationsUtil');

exports.parseReservationConversation = async (operation, metadata) => {
  const { result: campaign } = await Campaign
    .findOne({ users: { $elemMatch: { permlink: operation.parent_permlink } } });
  if (!campaign) return true;

  const reservedUser = _.find(campaign.users, (u) => u.rootName === operation.parent_author);
  await Campaign.updateOne({ users: { $elemMatch: { permlink: operation.parent_permlink } } },
    { $inc: { 'users.$.children': 1 } });
  if (_.get(metadata, 'waivioRewards.type')) return false;
  if (!reservedUser) return true;

  const guestAuthor = _.get(metadata, 'comment.userId');
  if (guestAuthor) operation.author = guestAuthor;

  await notificationsUtil.custom(Object.assign(operation, {
    id: 'campaignMessage',
    guideName: campaign.guideName,
    campaignName: campaign.name,
    reservedUser: _.get(reservedUser, 'name'),
  }));
  return false;
};
