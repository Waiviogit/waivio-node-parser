const { hiveMindClient } = require('utilities/steemApi/createClient');
const _ = require('lodash');
const { Threads } = require('database').models;
const { ObjectId } = require('mongoose').Types;
const moment = require('moment');
const { THREAD_TYPE_ECENCY, THREADS_ACC, THREAD_ACCOUNTS } = require('../../../constants/common');
const {
  extractLinks,
  extractMentions,
  extractHashtags,
  extractHashtagsFromMetadata,
  extractImages,
  extractCryptoTickers,
  getCryptoArray,
  getThreadType,
} = require('../../helpers/thredsHelper');

const createThread = async (comment, cryptoArray, threadType) => {
  const thread = _.pick(comment, [
    'author',
    'permlink',
    'parent_author',
    'parent_permlink',
    'body',
    'created',
    'replies',
    'children',
    'depth',
    'author_reputation',
    'net_rshares',
    'active_votes',
    'total_payout_value',
    'pending_payout_value',
    'percent_hbd',
    'cashout_time',
  ]);

  thread.links = extractLinks(comment.body);
  thread.mentions = extractMentions(comment.body);

  // For Ecency threads, extract hashtags from json_metadata.tags
  // For Leo threads, extract from body
  thread.hashtags = threadType === THREAD_TYPE_ECENCY
    ? extractHashtagsFromMetadata(comment.json_metadata)
    : extractHashtags(comment.body);

  thread.images = extractImages(comment.json_metadata);
  thread.tickers = extractCryptoTickers(comment.json_metadata, cryptoArray);
  thread.type = threadType;

  thread.createdAt = moment.utc(comment.created).format();
  thread._id = new ObjectId(moment.utc(comment.created).unix());
  try {
    await Threads.create(thread);
  } catch (error) {
    console.log(error);
  }
};

let postsProcessed = 0;

module.exports = async ({ author = THREADS_ACC }) => {
  if (!THREAD_ACCOUNTS.includes(author)) {
    console.error(`Invalid author: ${author}. Must be one of: ${THREAD_ACCOUNTS.join(', ')}`);
    process.exit(1);
  }

  try {
    const cryptoArray = await getCryptoArray();

    let start_author, start_permlink;

    while (true) {
      const posts = await hiveMindClient.database.getDiscussions(
        'blog',
        {
          tag: author,
          limit: 20,
          ...(start_author && { start_author }),
          ...(start_permlink && { start_permlink }),
        },
      );
      if (!posts.length) break;

      for (const post of posts) {
        postsProcessed++;
        const { author: postAuthor, permlink } = post;

        try {
          const comments = await hiveMindClient.database.call(
            'get_content_replies',
            [postAuthor, permlink],
          );

          // get_content_replies returns direct replies (depth === 1)
          for (const comment of comments) {
            if (comment.depth === 1) {
              // Detect thread type from comment's parent_author for consistency
              const threadType = getThreadType(comment.parent_author);
              await createThread(comment, cryptoArray, threadType);
            }
          }
        } catch (error) {
          console.error(`Error fetching comments for ${postAuthor}/${permlink}:`, error.message);
        }

        start_author = postAuthor;
        start_permlink = permlink;
        console.log('postsProcessed', postsProcessed);
      }
    }
  } catch (error) {
    console.log(error);
  }
};
