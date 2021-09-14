const { hiveMindClient } = require('utilities/steemApi/createClient');

const getPost = async (author, permlink) => {
  try {
    const post = await hiveMindClient.database.call('get_content', [author, permlink]);
    return { post };
  } catch (err) {
    return { err };
  }
};

const getPostsByAuthor = async (author) => {
  try {
    const posts = await hiveMindClient.database.getDiscussions(
      'blog',
      { tag: author, limit: 100 },
    );
    return { posts };
  } catch (err) {
    return { err };
  }
};

/**
 * Get votes on post/comment from blockchain
 * @param author {String} author of post/comment
 * @param permlink {String} permlink of post/comment
 * @returns {Promise<{err: *}|{votes: any}>}
 */
const getVotes = async (author, permlink) => {
  try {
    const votes = await hiveMindClient.database.call('get_active_votes', [author, permlink]);
    return { votes };
  } catch (err) {
    return { err };
  }
};

module.exports = { getPost, getVotes, getPostsByAuthor };
