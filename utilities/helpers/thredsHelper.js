const redisSetter = require('utilities/redis/redisSetter');
const redisGetter = require('utilities/redis/redisGetter');
const { ThreadModel } = require('models');
const _ = require('lodash');
const { parseJson } = require('./jsonHelper');
const { REDIS_KEY_TICKERS } = require('../../constants/common');
const { getTokens } = require('../hiveEngine/tokensContract');

const extractHashtags = (inputString) => {
  const hashtagRegex = /#[a-zA-Z0-9_-]+/g;
  const hashtags = inputString.match(hashtagRegex);

  if (!hashtags) {
    return [];
  }

  // Use map to remove the "#" symbol from each hashtag
  return hashtags.map((hashtag) => hashtag.slice(1));
};

const extractMentions = (inputString) => {
  const mentionRegex = /@[\w.]+/g;
  const mentions = inputString.match(mentionRegex);
  if (!mentions) return [];

  // Use map to remove the "@" symbol from each mention
  return mentions.map((hashtag) => hashtag.slice(1));
};

const extractLinks = (inputString) => {
  const linkRegex = /(https?:\/\/[^\s]+)/g;
  const links = inputString.match(linkRegex);

  return links || [];
};

const extractCryptoTickers = (inputString, cryptoArray) => {
  const tickers = cryptoArray.map((crypto) => `\\$${crypto}`);
  const tickersRegex = new RegExp(`(${tickers.join('|')})`, 'g');
  const matches = inputString.match(tickersRegex);

  if (!matches) {
    return [];
  }

  // Remove the "$" symbol from each match and remove duplicates
  const uniqueTickers = [...new Set(matches.map((match) => match.substring(1)))];

  return uniqueTickers;
};

const extractImages = (metadata) => {
  const json = parseJson(metadata);

  return json?.image ?? [];
};

const getCryptoArray = async () => {
  const cached = await redisGetter.smembers({ key: REDIS_KEY_TICKERS });
  if (cached.length) return cached;
  const symbols = ['HIVE', 'HBD', 'BTC', 'ETH', 'LTC'];
  let offset = 0;
  const limit = 1000;
  while (true) {
    const tokens = await getTokens({ query: {}, limit, offset });
    if (!tokens.length) break;
    symbols.push(...tokens.map((t) => t.symbol));
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
    filter: { author: thread.author, permlink: thread.permlink },
    update: thread,
    options: {
      upsert: true,
    },
  });
};

const parseThreadReply = async (comment) => {
  const { result } = await ThreadModel.findOne({
    filter: { author: comment.parent_author, permlink: comment.parent_permlink },
    projection: { author: 1, permlink: 1 },
  });
  if (!result) return;

  await ThreadModel.updateOne({
    filter: { author: comment.parent_author, permlink: comment.parent_permlink },
    update: {
      $addToSet: { replies: `${comment.author}/${comment.permlink}` },
      $inc: { children: 1 },
    },
    options: {
      upsert: true,
    },
  });
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
};
