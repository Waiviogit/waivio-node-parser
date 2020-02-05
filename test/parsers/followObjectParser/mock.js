const { UserFactory, ObjectFactory } = require('../../factories');
const { faker } = require('../../testHelper');

const dataForFollow = async ({
  follow, error, userName, auth_permlink,
} = {}) => {
  const author_permlink = auth_permlink || faker.random.string(10);
  const name = userName || faker.name.firstName();
  if (error) faker.random.string();
  await UserFactory.Create(name);
  await ObjectFactory.Create({ author_permlink });
  if (follow) {
    return {
      required_posting_auths: [name],
      json: `["follow",{"user": "${name}","author_permlink": "${author_permlink}","what": ["blog"]}]`,
    };
  }
  return {
    required_posting_auths: [name],
    json: `["follow",{"user": "${name}","author_permlink": "${author_permlink}","what": []}]`,
  };
};

module.exports = { dataForFollow };
