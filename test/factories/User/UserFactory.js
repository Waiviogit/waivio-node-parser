const _ = require('lodash');
const { User, faker } = require('../../testHelper');

const Create = async ({
  name, wobjects_weight, users_follow, objects_follow, count_posts, stage_version,
} = {}) => {
  const userName = name || faker.name.firstName().toLowerCase();
  const existUser = await User.findOne({ name: userName }).lean();

  if (existUser) return { user: existUser };
  const user = await User.create({
    name: userName,
    wobjects_weight: wobjects_weight || 0,
    users_follow: users_follow || [],
    objects_follow: objects_follow || [],
    count_posts: _.isNil(count_posts) ? faker.random.number(10) : count_posts,
    stage_version: _.isNil(stage_version) ? faker.random.number(5) : stage_version,
  });

  return { user: user.toObject() };
};

module.exports = { Create };
