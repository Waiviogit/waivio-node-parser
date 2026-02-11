const _ = require('lodash');
const { SpamUser: SpamUserSchema, Post } = require('database').models;
const { postsUtil } = require('utilities/steemApi');
const postWithObjectParser = require('parsers/postWithObjectParser');
const axios = require('axios');
const { TOKEN_WAIV } = require('../../../constants/hiveEngine');

const ACCOUNT_POSTS_LIMIT = 20;
const RESTORE_BATCH_SIZE = 500;

const accountHistory = async (params) => {
  try {
    return await axios.get('https://history.hive-engine.com/accountHistory', { params });
  } catch (error) {
    return error;
  }
};
/**
 * Fetch all blog posts for a given account by paginating through get_account_posts
 */
const fetchAllAccountPosts = async (account) => {
  const allPosts = [];
  let startAuthor;
  let startPermlink;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { posts, err } = await postsUtil.getAccountPosts({
      account,
      limit: ACCOUNT_POSTS_LIMIT,
      startAuthor,
      startPermlink,
    });

    if (err || !posts || !posts.length) break;

    // when paginating, first post is the same as last from prev page
    const newPosts = startAuthor ? posts.slice(1) : posts;
    if (!newPosts.length) break;

    allPosts.push(...newPosts);

    const lastPost = posts[posts.length - 1];
    startAuthor = lastPost.author;
    startPermlink = lastPost.permlink;

    // if we got less than limit, we've reached the end
    if (posts.length < ACCOUNT_POSTS_LIMIT) break;
  }

  return allPosts;
};

/**
 * Restore a single user's own post via postWithObjectParser.parse
 */
const restoreOwnPost = async (hivePost, history) => {
  const metadata = hivePost.json_metadata;

  const operation = {
    author: hivePost.author,
    title: hivePost.title,
    body: hivePost.body,
    json_metadata: JSON.stringify(hivePost.json_metadata),
    permlink: hivePost.permlink,
    parent_author: hivePost.parent_author || '',
    parent_permlink: hivePost.parent_permlink || '',
  };

  try {
    const result = await postWithObjectParser.parse({
      operation,
      metadata,
      post: hivePost,
      timestamp: hivePost.created,
    });
    if (_.get(result, 'error')) {
      console.error(`Error restoring post @${hivePost.author}/${hivePost.permlink}: ${result.error}`);
    }
    if (result?.post) {
      const { votes } = await postsUtil.getVotes(hivePost.author, hivePost.permlink);
      const authorReward = _.find(history, (el) => el.authorperm === `@${hivePost.author}/${hivePost.permlink}`)?.quantity || '0';
      const rewardNumber = parseFloat(authorReward);
      if (votes.length) {
        await Post.updateOne(
          { author: hivePost.author, permlink: hivePost.permlink },
          {
            $set: {
              active_votes: votes.map(({ reputation, time, ...rest }) => rest),
              ...(rewardNumber && { total_rewards_WAIV: rewardNumber * 2 }),
            },
          },
        );
      }
    }
  } catch (error) {
    console.error(`Exception restoring post @${hivePost.author}/${hivePost.permlink}: ${error.message}`);
  }
};

/**
 * Restore all posts for a single user
 */
const restoreUserPosts = async (account) => {
  console.log(`Restoring posts for user: ${account}`);

  const hivePosts = await fetchAllAccountPosts(account);
  if (!hivePosts.length) {
    console.log(`No posts found on chain for ${account}`);
    return;
  }

  const response = await accountHistory({
    account,
    symbol: TOKEN_WAIV.SYMBOL,
    ops: ['comments_authorReward'].toString(),
    limit: 1000,
  });

  const history = response.data || [];

  console.log(`Found ${hivePosts.length} posts on chain for ${account}`);

  let ownCount = 0;

  await SpamUserSchema.updateOne({ user: account }, { $set: { isSpam: false } });

  for (const hivePost of hivePosts) {
    // skip comments (replies), only restore root posts and reblogs
    if (hivePost.parent_author) continue;

    if (hivePost.author === account) {
      await restoreOwnPost(hivePost, history);
      ownCount++;
    }
  }
  console.log(`Restored for ${account}: ${ownCount} own posts`);
};

/**
 * Restore posts for all spam users (isSpam: true) using cursor
 */
const restoreAllSpamUsersPosts = async () => {
  console.log('Restoring posts for all spam users');

  const cursor = SpamUserSchema
    .find({ isSpam: true }, { user: 1 })
    .lean()
    .cursor({ batchSize: RESTORE_BATCH_SIZE });

  let userCount = 0;
  for await (const doc of cursor) {
    await restoreUserPosts(doc.user);
    userCount++;
    if (userCount % 100 === 0) {
      console.log(`Processed ${userCount} users so far...`);
    }
  }

  console.log(`Restore complete. Processed ${userCount} users total.`);
};

module.exports = {
  restoreUserPosts,
  restoreAllSpamUsersPosts,
};
