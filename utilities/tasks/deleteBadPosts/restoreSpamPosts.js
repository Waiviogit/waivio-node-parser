const _ = require('lodash');
const { SpamUser: SpamUserSchema } = require('database').models;
const { postsUtil } = require('utilities/steemApi');
const postWithObjectParser = require('parsers/postWithObjectParser');
const { Post } = require('models');
const jsonHelper = require('utilities/helpers/jsonHelper');

const ACCOUNT_POSTS_LIMIT = 100;
const RESTORE_BATCH_SIZE = 500;

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
const restoreOwnPost = async (hivePost) => {
  const metadata = jsonHelper.parseJson(hivePost.json_metadata, {});

  const operation = {
    author: hivePost.author,
    title: hivePost.title,
    body: hivePost.body,
    json_metadata: hivePost.json_metadata,
    permlink: hivePost.permlink,
    parent_author: hivePost.parent_author || '',
    parent_permlink: hivePost.parent_permlink || '',
  };

  try {
    const result = await postWithObjectParser.parse({
      operation,
      metadata,
      post: hivePost,
    });
    if (_.get(result, 'error')) {
      console.error(`Error restoring post @${hivePost.author}/${hivePost.permlink}: ${result.error}`);
    }
  } catch (error) {
    console.error(`Exception restoring post @${hivePost.author}/${hivePost.permlink}: ${error.message}`);
  }
};

/**
 * Restore a reblogged post for the given account
 */
const restoreReblog = async (account, hivePost) => {
  const { post: sourcePost, error } = await Post.findByBothAuthors({
    author: hivePost.author,
    permlink: hivePost.permlink,
  });

  // if source post not in our DB yet, parse it first
  if (!sourcePost && !error) {
    await restoreOwnPost(hivePost);
  }

  const { post: existingSource } = await Post.findByBothAuthors({
    author: hivePost.author,
    permlink: hivePost.permlink,
  });

  if (!existingSource) {
    console.error(`Cannot restore reblog for ${account}: source post @${hivePost.author}/${hivePost.permlink} not found`);
    return;
  }

  const data = {
    author: account,
    root_author: account,
    permlink: `${existingSource.author}/${hivePost.permlink}`,
    reblog_to: {
      author: existingSource.author,
      permlink: hivePost.permlink,
    },
    body: '',
    json_metadata: '',
    ..._.pick(existingSource, ['language', 'wobjects', 'id', 'blocked_for_apps']),
  };

  try {
    const { post: createdPost, error: createError } = await Post.create(data);
    if (createError) {
      console.error(`Error creating reblog for ${account}: ${createError.message || createError}`);
      return;
    }

    await Post.update({
      author: existingSource.author,
      permlink: hivePost.permlink,
      $addToSet: { reblogged_users: account },
    });

    if (createdPost) {
      console.log(`Restored reblog: ${account} -> @${hivePost.author}/${hivePost.permlink}`);
    }
  } catch (error) {
    console.error(`Exception restoring reblog for ${account}: ${error.message}`);
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

  console.log(`Found ${hivePosts.length} posts on chain for ${account}`);

  let ownCount = 0;
  let reblogCount = 0;

  for (const hivePost of hivePosts) {
    // skip comments (replies), only restore root posts and reblogs
    if (hivePost.parent_author) continue;

    if (hivePost.author === account) {
      await restoreOwnPost(hivePost);
      ownCount++;
    } else {
      await restoreReblog(account, hivePost);
      reblogCount++;
    }
  }
  await SpamUserSchema.updateOne({ user: account }, { $set: { isSpam: false } });
  console.log(`Restored for ${account}: ${ownCount} own posts, ${reblogCount} reblogs`);
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
