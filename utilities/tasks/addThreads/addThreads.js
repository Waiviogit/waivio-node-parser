const { hiveMindClient } = require('utilities/steemApi/createClient');
const { Threads } = require('database').models;

module.exports = async ({ author = 'leothreads' }) => {
  try {
    // start_author: data.start_author,
    //       start_permlink: data.start_permlink,

    const posts = await hiveMindClient.database.getDiscussions(
      'blog',
      { tag: author, limit: 100 },
    );

    for (const post of posts) {
      const { category, author, permlink } = post;
      const comments = await hiveMindClient.database.call(
        'get_state',
        [`${category}/@${author}/${permlink}`],
      );
      console.log();
    }

    console.log();
  } catch (error) {
    console.log(error);
  }
};
