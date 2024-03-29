const { Client } = require('@hiveio/dhive');
const _ = require('lodash');

const client = new Client('https://anyx.io');

module.exports = async (author, permlink) => {
  try {
    const comments = await client.database.call('get_content_replies', [author, permlink]);
    const result = _.map(comments, (comment) => ({
      operation: {
        parent_author: comment.parent_author,
        parent_permlink: comment.parent_permlink,
        author: comment.author,
        permlink: comment.permlink,
      },
      metadata: JSON.parse(comment.json_metadata),
    }));
    return { result };
  } catch (err) {
    return { err };
  }
};
