const _ = require('lodash');
const { Campaign } = require('models');
const notificationsUtil = require('utilities/notificationsApi/notificationsUtil');
const { getWobjWinField } = require('utilities/helpers/wobjectHelper');
const { FIELDS_NAMES } = require('constants/wobjectsData');

exports.parseReservationConversation = async (operation) => {
  const { result: campaign } = await Campaign
    .findOne({ users: { $elemMatch: { permlink: operation.parent_permlink } } });
  if (!campaign) return true;

  const reservedUser = _.find(campaign.users, (u) => u.name === operation.author);
  await Campaign.updateOne({ users: { $elemMatch: { permlink: operation.parent_permlink } } },
    { $inc: { 'users.$.children': 1 } });
  if (!reservedUser) return true;
  const winField = await getWobjWinField({
    fieldName: FIELDS_NAMES.NAME,
    authorPermlink: campaign.requiredObject,
  });
  await notificationsUtil.custom(Object.assign(operation, {
    id: 'campaignMessage',
    guideName: campaign.guideName,
    campaignName: _.get(winField, 'body', campaign.name),
  }));
  return false;
};
