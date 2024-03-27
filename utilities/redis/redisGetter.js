const {
  postRefsClient, lastBlockClient, tagCategoriesClient, expiredPostsClient,
} = require('utilities/redis/redis');
const config = require('config');

const getHashAll = async (key, client = postRefsClient) => client.hgetallAsync(key);

const zrevrange = async ({
  key, start, end, client = expiredPostsClient,
}) => client.zrevrangeAsync(key, start, end);

const getLastBlockNum = async (key) => {
  if (!key) {
    key = config.parseOnlyVotes ? 'last_vote_block_num' : 'last_block_num';
  }

  const num = await lastBlockClient.getAsync(key);

  return num ? parseInt(num, 10) : config.startFromBlock || 29937113;
};
const getTagCategories = async (key) => tagCategoriesClient.zrevrangeAsync(key, 0, -1);

const sismember = async ({
  key, member, client = expiredPostsClient,
}) => client.sismemberAsync(key, member);

const smembers = async ({
  key, client = expiredPostsClient,
}) => client.smembersAsync(key);

const getAsync = async ({ key, client = lastBlockClient }) => client.getAsync(key);

module.exports = {
  getHashAll, getLastBlockNum, getTagCategories, zrevrange, sismember, smembers, getAsync,
};
