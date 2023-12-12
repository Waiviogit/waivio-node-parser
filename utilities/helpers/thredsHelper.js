const redisSetter = require('utilities/redis/redisSetter');
const redisGetter = require('utilities/redis/redisGetter');
const { ThreadModel } = require('models');
const _ = require('lodash');
const { parseJson } = require('./jsonHelper');
const { REDIS_KEY_TICKERS } = require('../../constants/common');
const { getTokens } = require('../hiveEngine/tokensContract');

const getBodyLinksArray = (body, regularExpression) => _
  .chain(body.match(new RegExp(regularExpression, 'gm')))
  .reduce((acc, link) => [...acc, _.compact(link.match(regularExpression))[1]], [])
  .compact()
  .value();

const extractHashtags = (inputString) => {
  const hashtagRegex = /#[a-zA-Z0-9_-]+/g;
  const hashtags = inputString.match(hashtagRegex);

  const objectLinks = getBodyLinksArray(inputString, /\/object\/([a-z0-9-]*)/);

  // Use map to remove the "#" symbol from each hashtag
  return _.uniq([..._.map(hashtags, (hashtag) => hashtag.slice(1)), ...objectLinks]);
};

const extractMentions = (inputString) => {
  const mentionRegex = /@[\w.-]+/g;
  const mentions = inputString.match(mentionRegex);
  if (!mentions) return [];

  // Use map to remove the "@" symbol from each mention
  return _.map(mentions, (hashtag) => hashtag.slice(1));
};

const extractLinks = (inputString) => {
  const linkRegex = /(https?:\/\/[^\s]+)/g;
  const links = inputString.match(linkRegex);

  return links || [];
};

const extractCryptoTickers = (inputString, cryptoArray) => {
  const tickers = _.map(cryptoArray, (crypto) => `\\$${crypto}`);
  const tickersRegex = new RegExp(`(${tickers.join('|')})`, 'g');
  const matches = inputString.match(tickersRegex);

  if (!matches) {
    return [];
  }

  // Remove the "$" symbol from each match and remove duplicates
  const uniqueTickers = [...new Set(_.map(matches, (match) => match.substring(1)))];

  return uniqueTickers;
};

const extractImages = (metadata) => {
  const json = parseJson(metadata);

  return json?.image ?? [];
};

const getCryptoArray = async () => {
  const cached = await redisGetter.smembers({ key: REDIS_KEY_TICKERS });
  if (cached?.length) return cached;
  const symbols = ['HIVE', 'HBD', 'BTC', 'ETH', 'LTC'];
  let offset = 0;
  const limit = 1000;
  while (true) {
    const tokens = await getTokens({
      query: {},
      limit,
      offset,
    });
    if (!tokens?.length) break;
    symbols.push(..._.map(tokens, (t) => t?.symbol));
    offset += 1000;
  }

  await redisSetter.sadd(REDIS_KEY_TICKERS, symbols);
  await redisSetter.expire(REDIS_KEY_TICKERS, 60 * 60 * 24);
};

const parseThread = async (comment) => {
  const thread = _.omit(comment, [
    'json_metadata',
    'title',
  ]);
  thread.stats = {
    total_votes: comment?.active_votes?.length || 0,
  };

  const cryptoArray = await getCryptoArray();
  thread.links = extractLinks(comment.body);
  thread.mentions = extractMentions(comment.body);
  thread.hashtags = extractHashtags(comment.body);
  thread.images = extractImages(comment.json_metadata);
  thread.tickers = extractCryptoTickers(comment.json_metadata, cryptoArray);

  // todo add notification by hashtags check bell
  // todo add notification by mentions

  await ThreadModel.updateOne({
    filter: {
      author: thread.author,
      permlink: thread.permlink,
    },
    update: thread,
    options: {
      upsert: true,
    },
  });
};

const parseThreadReply = async (comment) => {
  const { result } = await ThreadModel.findOne({
    filter: {
      author: comment.parent_author,
      permlink: comment.parent_permlink,
    },
    projection: {
      author: 1,
      permlink: 1,
    },
  });
  if (!result) return;

  await ThreadModel.updateOne({
    filter: {
      author: comment.parent_author,
      permlink: comment.parent_permlink,
    },
    update: {
      $addToSet: { replies: `${comment.author}/${comment.permlink}` },
      $inc: { children: 1 },
    },
    options: {
      upsert: true,
    },
  });
};

const updateThreadVoteCount = async (votes) => {
  const uniqVotes = _.uniqWith(
    votes,
    (x, y) => x.author === y.author && x.permlink === y.permlink,
  );

  const incrRefs = _.chain(uniqVotes)
    .filter((v) => v.weight > 0)
    .map((v) => ({ author: v.author, permlink: v.permlink }))
    .value();

  const decrRefs = _.chain(uniqVotes)
    .filter(votes, (v) => v.weight === 0)
    .map((v) => ({ author: v.author, permlink: v.permlink }))
    .value();

  if (incrRefs) {
    const { result: postIncr } = await ThreadModel.find({
      filter: {
        $or: [...incrRefs],
      },
      projection: {
        _id: 1,
      },
    });
    if (postIncr?.length) {
      await ThreadModel.updateMany({
        filter: {
          _id: { $in: _.map(postIncr, '_id') },
        },
        update: {
          $inc: { 'stats.total_votes': 1 },
        },
      });
    }
  }

  if (decrRefs) {
    const { result: postDecr } = await ThreadModel.find({
      filter: {
        $or: [...decrRefs],
      },
      projection: {
        _id: 1,
      },
    });

    if (postDecr?.length) {
      await ThreadModel.updateMany({
        filter: {
          _id: { $in: _.map(postDecr, '_id') },
        },
        update: {
          $inc: { 'stats.total_votes': -1 },
        },
      });
    }
  }
};

module.exports = {
  extractImages,
  extractCryptoTickers,
  extractLinks,
  extractMentions,
  extractHashtags,
  getCryptoArray,
  parseThread,
  parseThreadReply,
  updateThreadVoteCount,
};
