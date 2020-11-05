const { Post } = require('models');
const { commentParser } = require('parsers');
const { postHelper } = require('utilities/helpers');

module.exports = async (transactions) => {
  for (const transaction of transactions) {
    if (transaction && transaction.operations && transaction.operations[0]) {
      for (const operation of transaction.operations) {
        if (operation[0] === 'comment') {
          if (operation[1].parent_author) continue;
          const { post } = await Post.findOne(operation[1]);
          if (!post) {
            await postHelper.createPost({
              author: operation[1].author,
              permlink: operation[1].permlink,
              commentParser,
              fromTTL: true,
            });
          }
        }
      }
    }
  }
};
