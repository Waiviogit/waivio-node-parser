const _ = require('lodash');
const guestCommentParser = require('parsers/guestCommentParser');

module.exports = async (transactions) => {
  for (const transaction of transactions) {
    if (transaction && transaction.operations && transaction.operations[0]) {
      for (const operation of transaction.operations) {
        if (operation[0] === 'comment') {
          if (!operation[1].parent_author) continue;
          const metadata = parseJson(operation[1].json_metadata);
          if (!_.get(metadata, 'comment.userId')) continue;
          await guestCommentParser.parse({ operation: operation[1], metadata });
        }
      }
    }
  }
};

const parseJson = (json) => {
  try {
    return JSON.parse(json);
  } catch (e) { return {}; }
};
