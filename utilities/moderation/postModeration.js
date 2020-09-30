const { App, Post } = require('models');
const _ = require('lodash');

/*
  This file include moderation of posts by specified APP.
  Every APP has own admins and moderation(with specified wobjects).
  For now moderation on posts have only block(ignore) some unnecessary content
  by adding app name to field "blocked_for_apps" directly to post doc in MongoDB.
  Downvote from admin or moderator indicates as signal to block this post in APP.
    Note: downvote from moderator indicate block post in app only if post have
    wobjects, which current moderator now is moderating.
 */

/**
 * Check downvote on post as block(ignore) content in specified APP
 * @param voter {String}
 * @param author {String}
 * @param permlink {String}
 * @returns {Promise<void|{error}>}
 */
exports.checkDownVote = async ({ voter, author, permlink }) => {
  const { apps, error } = await App.findByModeration(voter);
  if (error) {
    console.error(error);
    return { error };
  }
  if (!apps || _.isEmpty(apps)) return;
  return Post.update({
    author, permlink, $addToSet: { blocked_for_apps: { $each: [...apps.map((a) => a.host)] } },
  });
};
