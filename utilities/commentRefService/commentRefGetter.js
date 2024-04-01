const _ = require('lodash');
const { CommentRef } = require('models');
const { redisGetter, redisSetter } = require('utilities/redis');
const { COMMENT_REF_TYPES } = require('constants/common');
const { Promise } = require('mongoose');

const cacheRefList = {
  [COMMENT_REF_TYPES.postWithWobjects]: redisSetter.addPostWithWobj,
  [COMMENT_REF_TYPES.createWobj]: redisSetter.addWobjRef,
  [COMMENT_REF_TYPES.appendWobj]: redisSetter.addAppendWobj,
  [COMMENT_REF_TYPES.wobjType]: redisSetter.addObjectType,
};

const cacheRefListParams = {
  [COMMENT_REF_TYPES.postWithWobjects]: (commentPath, mongoResult) => [
    commentPath,
    _.get(mongoResult, 'wobjects'),
    _.get(mongoResult, 'guest_author', null),
  ],
  [COMMENT_REF_TYPES.createWobj]: (commentPath, mongoResult) => [
    commentPath,
    _.get(mongoResult, 'root_wobj'),
  ],
  [COMMENT_REF_TYPES.appendWobj]: (commentPath, mongoResult) => [
    commentPath,
    _.get(mongoResult, 'root_wobj'),
  ],
  [COMMENT_REF_TYPES.wobjType]: (commentPath, mongoResult) => [
    commentPath,
    _.get(mongoResult, 'name'),
  ],
};

/**
 * Method to get comment reference value(wobject, append, post, object_type).
 * Method get data from redis(cached data), or mongo(stable),
 * if data not found in redis but was found in mongo => upload to redis cache
 * @param commentPath {String} path to STEEM comment
 * (author + _ + permlink, e.x. asd09_my-first-post)
 * @returns {Promise<{Object}>} Return specified data about type of current comment
 * and data about current entity
 */
exports.getCommentRef = async (commentPath) => {
  const redisResult = await redisGetter.getHashAll(commentPath);
  if (redisResult) return redisResult;

  const mongoResult = await CommentRef.getRef(commentPath);
  if (_.get(mongoResult, 'error')) {
    console.error(mongoResult.error);
  }
  if (_.get(mongoResult, 'commentRef.type')) {
    const { type } = mongoResult.commentRef;

    const params = cacheRefListParams[type](commentPath, mongoResult.commentRef);
    await cacheRefList[type](...params);

    return mongoResult.commentRef;
  }
};

/**
 * @returns {Promise<Array>}
 */
exports.getCommentRefs = async (refs = []) => {
  const values = refs.map(async (el) => {
    const result = await redisGetter.getHashAll(el);
    return { comment_path: el, ...result };
  });

  const redisResult = await Promise.all(values);

  const missingTypePaths = redisResult.reduce((acc, el) => {
    if (!el.type) acc.push(el.comment_path);
    return acc;
  }, []);
  if (!missingTypePaths.length) return redisResult;

  const mongoResult = await CommentRef.getManyRefs(missingTypePaths);

  const updateRedisCache = mongoResult.map((el) => {
    const params = cacheRefListParams[el.type](el.comment_path, el);
    return cacheRefList[el.type](...params);
  });

  await Promise.all(updateRedisCache);

  return [...redisResult, ...mongoResult];
};
