const _ = require('lodash');
const { Campaign, Wobj } = require('models');
const notificationsUtil = require('utilities/notificationsApi/notificationsUtil');

exports.parseReservationConversation = async (operation) => {
  const { result: campaign } = await Campaign
    .findOne({ users: { $elemMatch: { permlink: operation.parent_permlink } } });
  if (!campaign) return true;

  const reservedUser = _.find(campaign.users, (u) => u.name === operation.author);
  await Campaign.updateOne({ users: { $elemMatch: { permlink: operation.parent_permlink } } },
    { $inc: { 'users.$.children': 1 } });
  if (!reservedUser) return true;
  const { wobject } = await Wobj.getOne({ author_permlink: campaign.requiredObject });

  await notificationsUtil.custom(Object.assign(operation, {
    id: 'campaignMessage',
    guideName: campaign.guideName,
    campaignName: _.find(wobject.fields, (f) => f.name === 'name').body || '',
  }));
  return false;
};
