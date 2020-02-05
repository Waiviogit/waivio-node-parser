const _ = require('lodash');
const { CommentRef } = require('../../models');
const { redisSetter } = require('../redis');

exports.addAppendWobj = async (commentPath, rootWobj) => {
  const mongoRes = await CommentRef.addAppendRef({
    comment_path: commentPath, root_wobj: rootWobj,
  });
  const redisRes = await redisSetter.addAppendWobj(commentPath, rootWobj);
  if (_.get(mongoRes, 'error') || _.get(redisRes, 'error')) {
    console.error(mongoRes.error || redisRes.error);
  }
};

exports.addWobjRef = async (commentPath, rootWobj) => {
  const mongoRes = await CommentRef.addWobjRef({ comment_path: commentPath, root_wobj: rootWobj });
  const redisRes = await redisSetter.addWobjRef(commentPath, rootWobj);
  if (_.get(mongoRes, 'error') || _.get(redisRes, 'error')) {
    console.error(mongoRes.error || redisRes.error);
  }
};

exports.addWobjTypeRef = async (commentPath, name) => {
  const mongoRes = await CommentRef.addWobjTypeRef({ comment_path: commentPath, name });
  const redisRes = await redisSetter.addObjectType(commentPath, name);
  if (_.get(mongoRes, 'error') || _.get(redisRes, 'error')) {
    console.error(mongoRes.error || redisRes.error);
  }
};

exports.addPostRef = async (commentPath, wobjects, guestAuthor) => {
  const mongoRes = await CommentRef.addPostRef({
    comment_path: commentPath, wobjects: JSON.stringify(wobjects), guest_author: guestAuthor,
  });
  const redisRes = await redisSetter.addPostWithWobj(commentPath, wobjects, guestAuthor);
  if (_.get(mongoRes, 'error') || _.get(redisRes, 'error')) {
    console.error(mongoRes.error || redisRes.error);
  }
};
