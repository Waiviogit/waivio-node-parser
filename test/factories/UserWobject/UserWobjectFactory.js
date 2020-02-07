const { faker, UserWobjects } = require('../../testHelper');

const Create = async ({ user_name, author_permlink, weight } = {}) => {
  const data = {
    user_name: user_name || faker.random.string(),
    author_permlink: author_permlink || faker.random.string(),
    weight: weight || faker.random.number(),
  };
  const userWobject = await UserWobjects.create(data);

  return userWobject._doc;
};


module.exports = { Create };
