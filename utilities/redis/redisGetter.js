const { postRefsClient, lastBlockClient, tagCategoriesClient, processedPostClient, } = require('utilities/redis/redis');

const PARSE_ONLY_VOTES = process.env.PARSE_ONLY_VOTES === 'true';

const getHashAll = async (key, client = postRefsClient) => client.hgetallAsync(key);
const getProcessedVote = async ({key, start, end, client = processedPostClient}) => await client.zrevrangeAsync(key, start, end);
const getLastBlockNum = async (key) => {
  if (!key) {
    key = PARSE_ONLY_VOTES ? 'last_vote_block_num' : 'last_block_num';
  }

  const num = await lastBlockClient.getAsync(key);

  return num ? parseInt(num, 10) : process.env.START_FROM_BLOCK || 29937113;
};
const getTagCategories = async (key) => tagCategoriesClient.zrevrangeAsync(key, 0, -1);

module.exports = {
  getHashAll, getLastBlockNum, getTagCategories, getProcessedVote,
};
