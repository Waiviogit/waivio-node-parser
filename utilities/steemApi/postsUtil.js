const { client } = require('./createClient');

const getPost = async (author, permlink) => {
  try {
    const post = await client.database.call('get_content', [author, permlink]);

    return { post };
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
    const votes = await client.database.call('get_active_votes', [author, permlink]);

    return { votes };
  } catch (err) {
    return { err };
  }
};

module.exports = { getPost, getVotes };
