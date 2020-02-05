const { faker } = require('../../../testHelper');

module.exports = (empty) => {
  if (empty) return [];
  return [
    {
      author_permlink: faker.random.string(),
      author: faker.name.firstName(),
      default_name: faker.name.firstName(),
    },
  ];
};
