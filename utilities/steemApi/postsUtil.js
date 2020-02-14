const { client } = require('./createClient');

const getPost = async (author, permlink) => {
  try {
    const post = await client.database.call('get_content', [author, permlink]);

    return { post };
  } catch (err) {
    return { err };
  }
};

module.exports = { getPost };
