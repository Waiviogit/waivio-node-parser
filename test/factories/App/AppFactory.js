const { faker, App, ObjectID } = require('test/testHelper');
const _ = require('lodash');
const { STATUSES } = require('constants/sitesData');

const Create = async ({
  name, admins, moderators, topUsers,
  referralsData, blackListUsers, bots, campaignAcc, campaignCommission, authority,
  indexAcc, indexCommission, referral, owner, host, status, blacklistApps, parent,
  canBeExtended, supportedTypes, inherited, configuration, deactivatedAt, activatedAt,
} = {}) => {
  const data = {
    host: host || faker.internet.domainWord(),
    owner: owner || faker.random.string(10),
    status: status || STATUSES.PENDING,
    name: name || faker.random.string(10),
    admins: admins || [faker.name.firstName().toLowerCase()],
    moderators: moderators || [],
    authority: authority || [],
    parent: parent || new ObjectID(),
    topUsers: topUsers || [],
    deactivatedAt: deactivatedAt || null,
    activatedAt: activatedAt || null,
    blacklist_apps: blacklistApps || [],
    canBeExtended: canBeExtended || false,
    supported_object_types: supportedTypes || ['restaurant'],
    inherited: inherited || true,
    configuration: configuration || { configurationFields: [faker.random.string()] },
    daily_chosen_post: {
      author: faker.name.firstName().toLowerCase(),
      permlink: faker.random.string(),
      title: faker.random.string(20),
    },
    weekly_chosen_post: {
      author: faker.name.firstName().toLowerCase(),
      permlink: faker.random.string(),
      title: faker.random.string(20),
    },
    referralsData: referralsData || [],
    black_list_users: blackListUsers || [],
    app_commissions: {
      campaigns_server_acc: campaignAcc || faker.name.firstName(),
      campaigns_percent: _.isNumber(campaignCommission) ? campaignCommission : 0.3,
      index_commission_acc: indexAcc || faker.name.firstName(),
      index_percent: _.isNumber(indexCommission) ? indexCommission : 0.2,
      referral_commission_acc: referral || faker.name.firstName(),
    },
  };

  return App.create(data);
};

module.exports = { Create };
