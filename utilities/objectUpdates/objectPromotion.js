const Joi = require('joi');
const _ = require('lodash');
const { App, Wobj } = require('models');
const {
  redisGetter,
  redisSetter,
  redis,
} = require('utilities/redis');
const { isInRange } = require('../helpers/calcHelper');
const { FIELDS_NAMES } = require('../../constants/wobjectsData');
const { REDIS_KEYS } = require('../../constants/parsersData');

const validationSchema = Joi.object().keys({
  host: Joi.string().required(),
  startDate: Joi.number().integer().min(0).required(), // timestamp
  endDate: Joi.number().integer().greater(Joi.ref('startDate')).required(), // timestamp
});

const checkStartKeyExists = async (key) => redisGetter.getAsync({
  key, client: redis.expiredPostsClient,
});

const calcTTLSeconds = (eventDateMs = 0) => {
  const now = Date.now();
  if (now > eventDateMs) return 1;
  return Math.round((eventDateMs - now) / 1000);
};

const setTTLByTimestamp = async ({ key, timestamp }) => {
  const ttlSeconds = calcTTLSeconds(timestamp);
  await redisSetter.setEx({
    key, ttlSeconds, client: redis.expiredPostsClient, value: '',
  });
};

const removeKey = async ({ key }) => {
  await redisSetter.deleteKey({
    key,
    client: redis.expiredPostsClient,
  });
};

const checkApprovedAdmins = ({ admins, owner, votes }) => {
  if (!votes?.length) return true;

  let adminVote, ownerVote;
  _.forEach(votes, (vote) => {
    vote.timestamp = vote._id
      ? vote._id.getTimestamp().valueOf()
      : Date.now();
    if (vote.voter === owner) {
      vote.owner = true;
      ownerVote = vote;
    } else if (_.includes(admins, vote.voter)) {
      vote.admin = true;
      if (vote.timestamp > _.get(adminVote, 'timestamp', 0)) adminVote = vote;
    }
  });

  const mainVote = ownerVote || adminVote;
  if (!mainVote) return true;

  return mainVote.percent > 0;
};

const validateCreator = async ({ host, creator }) => {
  const { result } = await App.findOne({ host });
  if (!result) return false;

  return [result.owner, ...result.admins].includes(creator);
};

const validTimeRange = ({ fields, startDate, endDate }) => fields
  .every((el) => !isInRange({ number: startDate, min: el.startDate, max: el.endDate })
    && !isInRange({ number: endDate, min: el.startDate, max: el.endDate }));

const validateOnAppend = async ({ field, objectPermlink }) => {
  const { wobject } = await Wobj.getOne({ author_permlink: objectPermlink });
  if (!wobject) return false;
  const { error, value } = validationSchema.validate({
    host: field.body,
    startDate: field.startDate,
    endDate: field.endDate,
  });
  if (error) return false;
  const validRange = validTimeRange({
    fields: _.filter(wobject.fields, (el) => el.name === FIELDS_NAMES.PROMOTION
      && el.body === field.body
      && el.weight > 0),
    startDate: value.startDate,
    endDate: value.endDate,
  });
  if (!validRange) return false;
  return validateCreator({
    host: value.host,
    creator: field.creator,
  });
};

const removeHostByPermlink = async ({
  host, objectPermlink,
}) => {
  await Wobj.update({ author_permlink: objectPermlink }, { $pull: { promotedOnSites: host } });
};

const addHostByPermlimk = async ({ host, objectPermlink }) => {
  await Wobj.update({ author_permlink: objectPermlink }, { $addToSet: { promotedOnSites: host } });
};

const specialUpdateOnPromotion = async ({
  field, authorPermlink, app, voter, percent,
}) => {
  const { body: host, startDate, endDate } = field;
  const now = Date.now();
  if (endDate < now) return;

  const { result } = await App.findOne({ host });
  if (!result) return;
  const { owner, admins } = result;
  const approved = checkApprovedAdmins({
    owner, admins, votes: field.active_votes ?? [],
  });
  const startKey = `${REDIS_KEYS.START_OBJECT_PROMOTION}:${authorPermlink}:${field.author}:${field.permlink}`;
  const endKey = `${REDIS_KEYS.END_OBJECT_PROMOTION}:${authorPermlink}:${field.author}:${field.permlink}`;

  if (!approved) {
    await removeKey({ key: startKey });
    await removeKey({ key: endKey });
    await removeHostByPermlink({ host, objectPermlink: authorPermlink });
    return;
  }

  const startKeyExists = await checkStartKeyExists(startKey);
  if (startKeyExists) return;

  const startNow = startDate < now;
  if (startNow) {
    await addHostByPermlimk({ host, objectPermlink: authorPermlink });
    await setTTLByTimestamp({
      key: endKey,
      timestamp: endDate,
    });
    return;
  }

  await setTTLByTimestamp({
    key: startKey,
    timestamp: startDate,
  });
  await setTTLByTimestamp({
    key: endKey,
    timestamp: endDate,
  });
};

const getLinksFromMsg = (msg) => {
  const data = msg.split(':');
  return {
    objectPermlink: data[1],
    fieldAuthor: data[2],
    fieldPermlink: data[3],
  };
};

const startPromotionHandler = async (msg = '') => {
  const { objectPermlink, fieldAuthor, fieldPermlink } = getLinksFromMsg(msg);

  const { field } = await Wobj.getField(fieldAuthor, fieldPermlink, objectPermlink);
  const { body: host } = field;
  const { result } = await App.findOne({ host });
  if (!result) return;
  const { owner, admins } = result;

  const approved = checkApprovedAdmins({
    owner, admins, votes: field.active_votes ?? [],
  });
  if (!approved) {
    await removeKey({
      key: `${REDIS_KEYS.END_OBJECT_PROMOTION}:${objectPermlink}:${field.author}:${field.permlink}`,
    });
    return;
  }

  await addHostByPermlimk({ host: field.body, objectPermlink });
};

const endPromotionHandler = async (msg = '') => {
  const { objectPermlink, fieldAuthor, fieldPermlink } = getLinksFromMsg(msg);
  const { field } = await Wobj.getField(fieldAuthor, fieldPermlink, objectPermlink);
  await removeHostByPermlink({ host: field.body, objectPermlink });
};

module.exports = {
  validateOnAppend,
  startPromotionHandler,
  endPromotionHandler,
  specialUpdateOnPromotion,
};
