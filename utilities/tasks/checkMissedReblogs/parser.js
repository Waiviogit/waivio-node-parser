const _ = require('lodash');
const { Post } = require('models');
const { userParsers, commentParser } = require('parsers');
const { postHelper } = require('utilities/helpers');

const reblogParseSwitcher = async (transactions) => {
  for (const transaction of transactions) {
    if (transaction && transaction.operations && transaction.operations[0]) {
      for (const operation of transaction.operations) {
        if (operation[0] === 'comment') {
          if (operation[1].parent_author) continue;
          const { post } = await Post.findOne(operation[1]);
          if (!post) {
            await postHelper.createPost({
              author: operation[1].author, permlink: operation[1].permlink, commentParser, fromTTL: true,
            });
          }
        }

        if (operation[0] === 'custom_json' && operation[1].id === 'follow') {
          await reblogParser(operation[1], transaction.block_num, transaction.expiration);
        }
      }
    }
  }
};

const reblogParser = async (operation, blockNum, time) => {
  let json;
  try {
    json = JSON.parse(operation.json);
  } catch (error) {
    console.error(error);
  }
  if (_.get(json, '[0]') === 'reblog' && _.get(operation, 'required_posting_auths[0]', _.get(operation, 'required_auths')) !== _.get(json, '[1].account')) {
    console.error('Can\'t reblog, account and author of operation are different');
  }
  if (_.get(json, '[0]') === 'reblog' && await notInDatabase(json[1], blockNum)) {
    const { post } = await Post.findOne(json[1]);
    if (!post) {
      await postHelper.createPost({
        author: json[1].author, permlink: json[1].permlink, commentParser, fromTTL: true,
      });
    }
    const id = postHelper.objectIdFromDateString(time);
    await userParsers.reblogPostParser({
      json, account: _.get(operation, 'required_posting_auths[0]'), id, fromTask: true,
    });
  }
};

const notInDatabase = async (json, blockNum) => {
  const { post, error } = await Post.findOne({ author: json.account, permlink: `${json.author}/${json.permlink}` });
  if (error) {
    console.error(`In block ${blockNum}:`, error);
    return false;
  }
  return !post;
};

module.exports = { reblogParseSwitcher };
