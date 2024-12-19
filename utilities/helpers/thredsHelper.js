const redisSetter = require('utilities/redis/redisSetter');
const redisGetter = require('utilities/redis/redisGetter');
const { ThreadModel } = require('models');
const _ = require('lodash');
const { usersUtil } = require('utilities/steemApi');
const moment = require('moment/moment');
const { parseJson } = require('./jsonHelper');
const { REDIS_KEY_TICKERS } = require('../../constants/common');
const { getTokens } = require('../hiveEngine/tokensContract');
const { getHashAll } = require('../redis/redisGetter');
const { REDIS_KEYS } = require('../../constants/parsersData');
const { lastBlockClient } = require('../redis/redis');

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

const detectBulkMessage = (metadata) => !!parseJson(metadata, null)?.bulkMessage;

const parseThread = async (comment, options) => {
  const cryptoArray = await getCryptoArray();
  const {
    body, json_metadata, author, permlink,
  } = comment;

  const updateData = {
    ..._.omit(comment, ['json_metadata', 'title']),
    percent_hbd: options?.percent_hbd ?? 10000,
    links: extractLinks(body),
    mentions: extractMentions(body),
    hashtags: extractHashtags(body),
    images: extractImages(json_metadata),
    tickers: extractCryptoTickers(json_metadata, cryptoArray),
    cashout_time: moment().add(7, 'days').toISOString(),
    bulkMessage: detectBulkMessage(json_metadata),
  };

  // todo add notification by hashtags check bell
  // todo add notification by mentions

  await ThreadModel.updateOne({
    filter: { author, permlink },
    update: updateData,
    options: { upsert: true },
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
  const uniqVotes = _.chain(votes)
    .uniqWith((x, y) => x.author === y.author && x.permlink === y.permlink)
    .map((v) => ({ author: v.author, permlink: v.permlink })).value();

  const { result } = await ThreadModel.find({
    filter: { $or: [...uniqVotes] },
  });
  if (!result?.length) return;

  const voteOps = _.filter(
    votes,
    (el) => _.find(result, (r) => r.author === el.author && r.permlink === el.permlink),
  );
  const priceInfo = await getHashAll(REDIS_KEYS.CURRENT_PRICE_INFO, lastBlockClient);
  const rewards = parseFloat(priceInfo.reward_balance) / parseFloat(priceInfo.recent_claims);
  const price = parseFloat(priceInfo.price);

  for (const vote of voteOps) {
    const post = _.find(result, (p) => (p.author === vote.author || p.author === vote.guest_author)
      && p.permlink === vote.permlink);
    vote.rshares = +vote.rshares;

    const voteInPost = _.find(post.active_votes, (v) => v.voter === vote.voter);

    const voteInPostRshares = _.get(voteInPost, 'rshares');
    voteInPost
      ? Object.assign(
        voteInPost,
        usersUtil.handleVoteInPost({
          vote,
          voteInPost,
          rshares: vote.rshares,
          rewards,
          price,
        }),
      )
      : post.active_votes.push({
        voter: vote.voter,
        percent: vote.weight,
        rshares: Math.round(vote.rshares),
        weight: Math.round(vote.rshares * 1e-6),
      });
    const createdOverAWeek = moment().diff(moment(_.get(post, 'createdAt')), 'day') > 7;
    if (!vote.rshares || createdOverAWeek) continue;
    // net_rshares sum of all post active_votes rshares negative and positive
    const tRShares = usersUtil.getPostNetRshares({
      netRshares: parseFloat(_.get(post, 'net_rshares', 0)),
      weight: vote.weight,
      voteInPostRshares,
      rshares: vote.rshares,
    });

    // *price - to calculate in HBD
    const postValue = tRShares * rewards * price;

    post.net_rshares = Math.round(tRShares);
    post.pending_payout_value = postValue < 0 ? '0.000 HBD' : `${postValue.toFixed(3)} HBD`;
  }

  await Promise.all(result.map(async (el) => el.save()));
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
