/* eslint-disable camelcase */
const {
  User, UserExpertise, WObject, Post,
} = require('database').models;

const { hiveMindClient } = require('utilities/steemApi/createClient');

const getAccountPosts = async ({ start_author = null, start_permlink = null, account = '' }) => {
  try {
    const posts = await hiveMindClient.call('bridge', 'get_account_posts', {
      sort: 'blog',
      account: 'flowmaster',
      limit: 30,
      start_author,
      start_permlink,

    });

    return { result: posts };
  } catch (error) {
    return { error };
  }
};

const getAccountPosts2 = async () => {
  try {
    const posts = await hiveMindClient.call('condenser_api', 'get_blog', ['flowmaster', 0, 30]);
    return { result: posts };
  } catch (error) {
    return { error };
  }
};

const processUserExpertise = async (user) => {
  const wobjects = await WObject.find({ 'fields.active_votes.voter': user.name }).lean();
  if (!wobjects.length) {

  } else {
    const votesWithDates = [];
    for (const wobject of wobjects) {
      for (const field of wobject.fields) {
        for (const vote of field.active_votes) {
          if(vote.voter === user.name )
          console.log();
        }
      }
    }

    console.log();
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
