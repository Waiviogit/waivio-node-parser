const _ = require('lodash');
const { Campaign, CampaignV2 } = require('models');
const notificationsUtil = require('utilities/notificationsApi/notificationsUtil');

const CAMPAIGNS_META = ['waivio_activate_campaign', 'waivio_stop_campaign', 'stopCampaign', 'activateCampaign'];

// need replace notification to campaign service
exports.parseReservationConversation = async (operation, metadata) => {
  const { result: campaign } = await Campaign
    .findOne({ users: { $elemMatch: { permlink: operation.parent_permlink } } });

  const { result: campaignV2 } = await CampaignV2
    .findOne({
      filter: { users: { $elemMatch: { reservationPermlink: operation.parent_permlink } } },
      projection: { 'users.$': 1 },
    });
  const condition = (!campaign || !campaignV2)
    && !_.includes(CAMPAIGNS_META, _.get(metadata, 'waivioRewards.type'));

  if (condition) return true;
  const reservedUser = _.find(_.get(campaign, 'users', []), (u) => u.rootName === operation.parent_author);
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
