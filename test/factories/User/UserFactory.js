const _ = require('lodash');
const { REFERRAL_STATUSES } = require('constants/appData');
const { User, faker } = require('test/testHelper');

const Create = async ({
  name, wobjects_weight, users_follow, objects_follow, count_posts,
  stage_version, json_metadata, posting_json_metadata, referral, referralStatus,
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
    json_metadata: json_metadata || '',
    posting_json_metadata: posting_json_metadata || '',
    referral: referral || [],
    referralStatus: referralStatus || REFERRAL_STATUSES.NOT_ACTIVATED,
  });

  return { user: user.toObject() };
};

module.exports = { Create };
