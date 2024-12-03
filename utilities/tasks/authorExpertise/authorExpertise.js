const { User, UserExpertise, WObject } = require('database').models;

const { hiveMindClient } = require('utilities/steemApi/createClient');

const processUserExpertise = async (user) => {
  const wobjects = await WObject.find({ 'fields.active_votes.voter': user.name }).lean();
  if (!wobjects.length) {

  } else {
    // process with fields
  }

  await User.updateOne({ name: user.name }, { processed: true });
};

const rewriteExpertise = async () => {
  while (true) {
    const users = await User.find({ processed: false }, { }, { limit: 100 }).lean();
    for (const user of users) {
      await processUserExpertise(user);
    }
    if (!users.length) break;
  }
};

module.exports = rewriteExpertise;
