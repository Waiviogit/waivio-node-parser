const { faker } = require('../../../testHelper');


module.exports = ({
  parent_author, parent_permlink, author, permlink, getError, count,
} = {}) => {
  if (getError) {
    return { error: 'Some test error' };
  }
  const result = [];
  for (let counter = 0; counter < (count || 1); counter++) {
    result.push(
      {
        operation: {
          parent_author: parent_author || faker.name.firstName(),
          parent_permlink: parent_permlink || faker.random.string(10),
          author: author || faker.name.firstName(),
          permlink: permlink || faker.random.string(10),
        },
        metadata: {
          app: 'waivio/1.0.0',
          community: '',
          tags: 'waivio-object',
          wobj: {
            action: 'appendObject',
            creator: faker.name.firstName(),
            field: {
              name: faker.random.string(10),
              body: faker.random.string(20),
              locale: 'ru-RU',
            },
          },
        },
      },
    );
  }
  return { result };
};
