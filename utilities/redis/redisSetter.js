const {
  postRefsClient, lastBlockClient, expiredPostsClient, tagCategoriesClient, mainFeedsCacheClient,
} = require('utilities/redis/redis');
const { COMMENT_REF_TYPES } = require('constants/common');
const { FIELDS_NAMES } = require('constants/wobjectsData');

const PARSE_ONLY_VOTES = process.env.PARSE_ONLY_VOTES === 'true';

/**
 * Set ref to post to redis
 * @param path {String} author and permlink joined with underline
 * @param wobjects {String} Stringified array of wobjects on post
 * @param guestAuthor {String} If post was written from guest user, put here his name
 * @returns {Promise<void>}
 */
const addPostWithWobj = async (path, wobjects, guestAuthor) => {
  const wobjectsStr = typeof wobjects === 'string' ? wobjects : JSON.stringify(wobjects);
  await postRefsClient.hsetAsync(path, 'type', COMMENT_REF_TYPES.postWithWobjects);
  await postRefsClient.hsetAsync(path, 'wobjects', wobjectsStr);
  if (guestAuthor) await postRefsClient.hsetAsync(path, 'guest_author', guestAuthor);
};

/**
 * Set ref to create wobj comment to redis
 * @param path {String} author and permlink joined with underline
 * @param rootWobj {String} author_permlink of wobject (actually permlink of comment)
 * @returns {Promise<void>}
 */
const addWobjRef = async (path, rootWobj) => {
  await postRefsClient.hsetAsync(path, 'type', COMMENT_REF_TYPES.createWobj);
  await postRefsClient.hsetAsync(path, 'root_wobj', rootWobj); // root_wobj is author_permlink of wobject(just permlink)
};

/**
 * Set ref to comment with append on wobj to redis
 * @param path {String} author and permlink joined with underline
 * @param rootWobj {String} author_permlink of parent "Wobject"
 * @returns {Promise<void>}
 */
const addAppendWobj = async (path, rootWobj) => {
  await postRefsClient.hsetAsync(path, 'type', COMMENT_REF_TYPES.appendWobj); // author_permlink is 'author' + '_' + 'permlink' of comment with appendWobject
  await postRefsClient.hsetAsync(path, 'root_wobj', rootWobj); // root_wobj is author_permlink of wobject
};

/**
 * Set ref to comment with create Object Type redis
 * @param path {String} author and permlink joined with underline
 * @param name {String} "name" of created Object Type
 * @returns {Promise<void>}
 */
const addObjectType = async (path, name) => {
  await postRefsClient.hsetAsync(path, 'type', COMMENT_REF_TYPES.wobjType);
  await postRefsClient.hsetAsync(path, 'name', name);
};

const setLastBlockNum = async (blockNum, redisKey) => {
  if (blockNum) {
    let key = PARSE_ONLY_VOTES ? 'last_vote_block_num' : 'last_block_num';
    if (redisKey) key = redisKey;
    await lastBlockClient.setAsync(key, blockNum);
    lastBlockClient.publish(key, blockNum);
  }
};

const setExpiredPostTTL = async (name, id, timer, value = '') => {
  await expiredPostsClient.setAsync(`expire-${name}:${id}`, value, 'EX', timer);
};

const addTagCategory = async ({ categoryName, objectType, tags }) => tagCategoriesClient.zaddAsync(`${FIELDS_NAMES.TAG_CATEGORY}:${objectType}:${categoryName}`, tags);

const hmsetAsync = async (key, data, client = lastBlockClient) => client.hmsetAsync(key, data);

const sadd = async (key, data, client = expiredPostsClient) => client.saddAsync(key, data);

const zremrangebyscore = async ({
  key, start, end, client = expiredPostsClient,
}) => client.zremrangebyscoreAsync(key, start, end);

const zrem = async ({
  key, member, client = expiredPostsClient,
}) => client.zremAsync(key, member);

const expire = async (key, time, client = expiredPostsClient) => client.expireAsync(key, time);

const publishToChannel = async ({ channel, msg, client = lastBlockClient }) => {
  await client.publishAsync(channel, msg);
};

const incrementTag = async ({ categoryName, tag, objectType }) => tagCategoriesClient.zincrbyAsync(`${FIELDS_NAMES.TAG_CATEGORY}:${objectType}:${categoryName}`, 1, tag);
const incrementDepartmentTag = async ({ categoryName, tag, department }) => tagCategoriesClient.zincrbyAsync(`${FIELDS_NAMES.DEPARTMENTS}:${department}:${categoryName}`, 1, tag);

/**
 * @param key {String}
 * @param client {}
 */
const deleteKey = async ({ key, client = mainFeedsCacheClient }) => client.delAsync(key);

module.exports = {
  setExpiredPostTTL,
  zremrangebyscore,
  setLastBlockNum,
  addPostWithWobj,
  addTagCategory,
  addAppendWobj,
  addObjectType,
  addWobjRef,
  hmsetAsync,
  sadd,
  expire,
  zrem,
  publishToChannel,
  incrementTag,
  incrementDepartmentTag,
  deleteKey,
};
