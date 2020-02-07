const _ = require('lodash');
const { CommentRef } = require('models');
const { redisGetter, redisSetter } = require('utilities/redis');
const { COMMENT_REF_TYPES } = require('utilities/constants');

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
  } else if (_.get(mongoResult, 'commentRef.type')) {
    switch (mongoResult.commentRef.type) {
      case COMMENT_REF_TYPES.postWithWobjects:
        await redisSetter.addPostWithWobj(commentPath, _.get(mongoResult, 'commentRef.wobjects'), null);
        break;

      case COMMENT_REF_TYPES.createWobj:
        await redisSetter.addWobjRef(commentPath, _.get(mongoResult, 'commentRef.root_wobj'));
        break;

      case COMMENT_REF_TYPES.appendWobj:
        await redisSetter.addAppendWobj(commentPath, _.get(mongoResult, 'commentRef.root_wobj'));
        break;

      case COMMENT_REF_TYPES.wobjType:
        await redisSetter.addObjectType(commentPath, _.get(mongoResult, 'commentRef.name'));
        break;
    }
    return mongoResult.commentRef;
  }
};
