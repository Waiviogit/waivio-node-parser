const { faker, App } = require('test/testHelper');

const Create = async ({
  blacklists, name, admins, moderators, topUsers,
  referralsData, blackListUsers, bots,
} = {}) => {
  const data = {
    name: name || faker.random.string(10),
    admins: admins || [faker.name.firstName().toLowerCase()],
    moderators: moderators || [],
    topUsers: topUsers || [],
    blacklists: blacklists || {
      users: [], wobjects: [], posts: [], apps: [],
    },
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
  };

  return App.create(data);
};

module.exports = { Create };
