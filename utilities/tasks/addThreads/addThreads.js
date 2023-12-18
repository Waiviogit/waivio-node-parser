const { hiveMindClient } = require('utilities/steemApi/createClient');
const _ = require('lodash');
const { Threads } = require('database').models;
const { ObjectId } = require('mongoose').Types;
const moment = require('moment');
const {
  extractLinks,
  extractMentions,
  extractHashtags,
  extractImages,
  extractCryptoTickers,
  getCryptoArray,
} = require('../../helpers/thredsHelper');

const createThread = async (comment, cryptoArray) => {
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
  ]);

  thread.links = extractLinks(comment.body);
  thread.mentions = extractMentions(comment.body);
  thread.hashtags = extractHashtags(comment.body);
  thread.images = extractImages(comment.json_metadata);
  thread.tickers = extractCryptoTickers(comment.json_metadata, cryptoArray);

  // images
  // tickers

  thread.createdAt = moment.utc(comment.created).format();
  thread._id = new ObjectId(moment.utc(comment.created).unix());
  try {
    await Threads.create(thread);
  } catch (error) {
    console.log(error);
  }
};

let postsProcessed = 0;

module.exports = async ({ author = 'leothreads' }) => {
  try {
    const cryptoArray = await getCryptoArray();

    let start_author, start_permlink;

    while (true) {
      const posts = await hiveMindClient.database.getDiscussions(
        'blog',
        {
          tag: author,
          limit: 100,
          ...(start_author && { start_author }),
          ...(start_permlink && { start_permlink }),
        },
      );
      if (!posts.length) break;

      for (const post of posts) {
        postsProcessed++;
        const { category, author, permlink } = post;
        const comments = await hiveMindClient.database.call(
          'get_state',
          [`${category}/@${author}/${permlink}`],
        );

        for (const commentsKey in comments.content) {
          const comment = comments.content[commentsKey];
          if (comment.author === author && comment.permlink === permlink) continue;
          if (comment.depth === 1) {
            await createThread(comment, cryptoArray);
          }
        }
        start_author = post.author;
        start_permlink = post.permlink;
        console.log('postsProcessed', postsProcessed);
      }
    }
  } catch (error) {
    console.log(error);
  }
};
