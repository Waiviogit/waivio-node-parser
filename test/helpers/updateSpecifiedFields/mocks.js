const _ = require('lodash');
const { SEARCH_FIELDS } = require('constants/wobjectsData');
const { faker } = require('test/testHelper');

const getMocksData = async () => {
  const author = faker.name.firstName().toLowerCase();
  const permlink = faker.random.string(10);
  const authorPermlink = faker.random.string(10);

  const metadata = {
    wobj: {
      field: {
        name: _.sample([SEARCH_FIELDS.NAME, SEARCH_FIELDS.EMAIL, SEARCH_FIELDS.PHONE]),
        body: faker.random.string(10),
        locale: faker.random.locale(),
        number: faker.random.string(10),
      },
    },
  };
  return {
    author, permlink, authorPermlink, metadata,
  };
};

module.exports = { getMocksData };
