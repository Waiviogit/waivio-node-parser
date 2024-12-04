const { redis } = require('utilities/redis');
const { commentParser } = require('parsers');
const postHelper = require('utilities/helpers/postHelper');
const config = require('config');
const { REDIS_KEYS } = require('../../constants/parsersData');
const objectPromotion = require('../objectUpdates/objectPromotion');

const getAuthorPermlinkFromMsg = (msg) => {
  const data = msg.split(':');
  const [author, permlink] = data[1].split('/');
  return { author, permlink };
};

const expireHivePost = async (msg) => {
  const { author, permlink } = getAuthorPermlinkFromMsg(msg);
  await postHelper.updateExpiredPost(author, permlink);
};

const expireNotFoundPost = async (msg) => {
  const { author, permlink } = getAuthorPermlinkFromMsg(msg);
  await postHelper.createPost({
    author, permlink, fromTTL: true, commentParser,
  });
};

const expireNotFoundGuestComment = async (msg) => {
  const { author, permlink } = getAuthorPermlinkFromMsg(msg);
  await postHelper.guestCommentFromTTL(author, permlink);
};

const expireActions = {
  'expire-hivePost': expireHivePost,
  'expire-notFoundPost': expireNotFoundPost,
  'expire-notFoundGuestComment': expireNotFoundGuestComment,
  [REDIS_KEYS.START_OBJECT_PROMOTION]: objectPromotion.startPromotionHandler,
  [REDIS_KEYS.END_OBJECT_PROMOTION]: objectPromotion.endPromotionHandler,
  default: () => {},
};

const expiredDataListener = async (chan, msg) => {
  const data = msg.split(':');
  if (config.parseOnlyVotes || !data[1]) return;

  const action = expireActions[data[0]] || expireActions.default;
  await action(msg);
};

exports.startRedisListener = () => {
  redis.expiredListener(expiredDataListener);
};
