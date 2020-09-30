const { faker, App } = require('test/testHelper');
const _ = require('lodash');
const { STATUSES } = require('constants/sitesData');

const Create = async ({
  name, admins, moderators, topUsers,
  referralsData, blackListUsers, bots, campaignAcc, campaignCommission,
  indexAcc, indexCommission, referral, owner, host, status, blacklistApps,
} = {}) => {
  const data = {
    host: host || faker.internet.domainWord(),
    owner: owner || faker.random.string(10),
    status: status || STATUSES.PENDING,
    name: name || faker.random.string(10),
    admins: admins || [faker.name.firstName().toLowerCase()],
    moderators: moderators || [],
    topUsers: topUsers || [],
    blacklist_apps: blacklistApps || [],

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
    service_bots: bots || [],
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
