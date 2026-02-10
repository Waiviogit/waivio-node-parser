const axios = require('axios');
const _ = require('lodash');
const { Post } = require('database').models;
const { SpamUser } = require('../../../models');
const { getTokenBalances } = require('../../hiveEngine/tokensContract');
const whitelist = require('./whitelist');

const SPAMINATOR_URL = 'https://spaminator.me/api/bl/all.json';
const BULK_WRITE_CHUNK_SIZE = 1000;
const DELETE_POSTS_BATCH_SIZE = 500;

let whitelistSet = new Set(whitelist);

const WAIV_BALANCE_QUERY = {
  symbol: 'WAIV',
  $or: [
    { stake: { $regex: '[1-9]' } },
    { delegationsIn: { $regex: '[1-9]' } },
    { delegationsOut: { $regex: '[1-9]' } },
  ],
};

const WAIV_PAGE_LIMIT = 1000;
const WAIV_PAGE_DELAY_MS = 500;

const delay = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

const fetchWaivHolders = async () => {
  const accounts = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const result = await getTokenBalances({
      query: WAIV_BALANCE_QUERY,
      offset,
      limit: WAIV_PAGE_LIMIT,
    });

    if (!Array.isArray(result) || !result.length) {
      hasMore = false;
      break;
    }

    accounts.push(...result.map((r) => r.account));
    offset += WAIV_PAGE_LIMIT;
    await delay(WAIV_PAGE_DELAY_MS);
  }

  console.log(`Fetched ${accounts.length} WAIV holders for whitelist`);
  return accounts;
};

const loadWhitelist = async () => {
  const { result, error } = await SpamUser.find({ isSpam: false }, { user: 1 });
  if (error) {
    console.error('Error loading whitelisted users from DB', error);
  }
  const dbWhitelisted = (result || []).map((u) => u.user);
  const waivHolders = await fetchWaivHolders();
  whitelistSet = new Set([...whitelist, ...dbWhitelisted, ...waivHolders]);
  console.log(`Whitelist loaded: ${whitelist.length} preset + ${dbWhitelisted.length} from DB + ${waivHolders.length} WAIV holders = ${whitelistSet.size} total`);
};

const checkInWhitelist = (user) => whitelistSet.has(user);

const fetchSpaminatorList = async () => {
  try {
    const { data } = await axios.get(SPAMINATOR_URL);
    return data.result || [];
  } catch (error) {
    console.error('Error fetching spam list from Spaminator', error.message);
    throw error;
  }
};

const getCurrentSpamUsers = async () => {
  const { result, error } = await SpamUser.find({ isSpam: true }, { user: 1 });
  if (error) {
    console.error('Error fetching current spam users from DB', error);
    throw error;
  }
  return result;
};

const calculateDifferences = (currentSpamUsers, spaminatorList) => {
  const currentSpamSet = new Set(currentSpamUsers.map((u) => u.user));
  const newSpamSet = new Set(spaminatorList);

  const toAdd = [];
  const toRemove = [];

  for (const user of newSpamSet) {
    if (currentSpamSet.has(user)) {
      continue;
    }
    if (!checkInWhitelist(user)) {
      toAdd.push(user);
      continue;
    }

    toRemove.push(user);
  }

  return { toAdd, toRemove };
};

const REBLOG_CHECK_CHUNK_SIZE = 100;

// batch-check which candidates have at least one reblogged post
const filterByReblogs = async (candidates) => {
  if (!candidates.length) return candidates;

  const rebloggedUsers = new Set();
  let totalChecked = 0;

  for (const chunk of _.chunk(candidates, REBLOG_CHECK_CHUNK_SIZE)) {
    const orConditions = chunk.map((user) => ({
      permlink: { $regex: new RegExp(`^${_.escapeRegExp(user)}/`) },
    }));

    const results = await Post.aggregate([
      { $match: { $or: orConditions } },
      {
        $addFields: {
          _reblogUser: { $arrayElemAt: [{ $split: ['$permlink', '/'] }, 0] },
        },
      },
      { $group: { _id: '$_reblogUser' } },
    ]);

    results.forEach((r) => rebloggedUsers.add(r._id));
    totalChecked += chunk.length;
    console.log(`Reblog check progress: ${totalChecked}/${candidates.length} checked, ${rebloggedUsers.size} found`);
  }

  console.log(`Users with reblogs excluded from spam: ${rebloggedUsers.size}`);
  return candidates.filter((u) => !rebloggedUsers.has(u));
};

const buildBulkOperations = (toAdd, toRemove) => {
  const bulkOps = [];

  toAdd.forEach((user) => {
    bulkOps.push({
      updateOne: {
        filter: { user, type: 'spaminator' },
        update: { isSpam: true },
        upsert: true,
      },
    });
  });

  toRemove.forEach((user) => {
    bulkOps.push({
      updateOne: {
        filter: { user, type: 'spaminator' },
        update: { isSpam: false },
        upsert: true,
      },
    });
  });

  return bulkOps;
};

const executeBulkWrites = async (bulkOps) => {
  if (!bulkOps.length) {
    return;
  }

  const chunks = _.chunk(bulkOps, BULK_WRITE_CHUNK_SIZE);
  for (const chunk of chunks) {
    await SpamUser.bulkWrite(chunk);
  }
  console.log(`Processed ${bulkOps.length} updates in ${chunks.length} chunks`);
};

const deleteSpamPosts = async () => {
  const { SpamUser: SpamUserSchema } = require('database').models;

  let totalPostsDeleted = 0;
  const cursor = SpamUserSchema
    .find({ isSpam: true }, { user: 1 })
    .lean()
    .cursor({ batchSize: DELETE_POSTS_BATCH_SIZE });

  let batch = [];

  for await (const doc of cursor) {
    batch.push(doc.user);

    if (batch.length >= DELETE_POSTS_BATCH_SIZE) {
      const { deletedCount } = await Post.deleteMany({ author: { $in: batch } });
      totalPostsDeleted += deletedCount;

      console.log(`Batch ${batch.length} authors: ${deletedCount} posts`);
      batch = [];
    }
  }

  // remaining batch
  if (batch.length) {
    const { deletedCount } = await Post.deleteMany({ author: { $in: batch } });
    totalPostsDeleted += deletedCount;
    console.log(`Batch ${batch.length} authors: ${deletedCount} posts`);
  }

  console.log(`Total posts deleted: ${totalPostsDeleted}`);
};

const updateSpamList = async () => {
  console.log('Task started: Update Spaminator blacklist');

  await loadWhitelist();

  const spaminatorList = await fetchSpaminatorList();
  if (!spaminatorList.length) {
    console.log('No users fetched from Spaminator');
    return;
  }
  console.log(`Fetched ${spaminatorList.length} users from Spaminator`);

  const currentSpamUsers = await getCurrentSpamUsers();
  const { toAdd, toRemove } = calculateDifferences(currentSpamUsers, spaminatorList);

  console.log(`Candidates to add: ${toAdd.length}`);
  const filteredToAdd = await filterByReblogs(toAdd);
  const filteredSet = new Set(filteredToAdd);
  const reblogExcluded = toAdd.filter((u) => !filteredSet.has(u));
  toRemove.push(...reblogExcluded);
  console.log(`Users to add (after reblog filter): ${filteredToAdd.length}`);
  console.log(`Users excluded by reblog filter (moved to remove): ${reblogExcluded.length}`);
  console.log(`Users to remove: ${toRemove.length}`);

  const bulkOps = buildBulkOperations(filteredToAdd, toRemove);
  await executeBulkWrites(bulkOps);

  console.log('Task finished: Update Spaminator blacklist');
};

module.exports = { updateSpamList, deleteSpamPosts };
