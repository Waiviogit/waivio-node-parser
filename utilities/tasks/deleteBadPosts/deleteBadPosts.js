const axios = require('axios');
const _ = require('lodash');
const { Post } = require('database').models;
const { SpamUser } = require('../../../models');
const whitelist = require('./whitelist');

const SPAMINATOR_URL = 'https://spaminator.me/api/bl/all.json';
const BULK_WRITE_CHUNK_SIZE = 1000;
const DELETE_POSTS_BATCH_SIZE = 500;

let whitelistSet = new Set(whitelist);

const loadWhitelist = async () => {
  const { result, error } = await SpamUser.find({ isSpam: false }, { user: 1 });
  if (error) {
    console.error('Error loading whitelisted users from DB', error);
  }
  const dbWhitelisted = (result || []).map((u) => u.user);
  whitelistSet = new Set([...whitelist, ...dbWhitelisted]);
  console.log(`Whitelist loaded: ${whitelist.length} preset + ${dbWhitelisted.length} from DB = ${whitelistSet.size} total`);
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
    if (!currentSpamSet.has(user) && !checkInWhitelist(user)) {
      toAdd.push(user);
    }
  }

  for (const user of currentSpamSet) {
    if (!newSpamSet.has(user)) {
      toRemove.push(user);
    }
  }

  return { toAdd, toRemove };
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

const deleteBadPosts = async () => {
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

  console.log(`Users to add: ${toAdd.length}`);
  console.log(`Users to remove: ${toRemove.length}`);

  const bulkOps = buildBulkOperations(toAdd, toRemove);
  await executeBulkWrites(bulkOps);

  await deleteSpamPosts();

  console.log('Task finished');
};

module.exports = { deleteBadPosts };
