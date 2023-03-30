const { App, Post, hiddenPostModel } = require('models');
const { CAN_MUTE_GLOBAL } = require('constants/sitesData');
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

const getModeratedApps = async (user) => {
  if (_.includes(CAN_MUTE_GLOBAL, user)) {
    const { result } = await App.find({}, { host: 1 });
    return _.map(result, 'host');
  }
  const { apps } = await App.findByModeration(user);
  return _.map(apps, 'host');
};

/**
 * Check downvote on post as block(ignore) content in specified APP
 * @param voter {String}
 * @param author {String}
 * @param permlink {String}
 * @param guestAuthor
 * @param hide {boolean}
 * @returns {Promise<void|{error}>}
 */
exports.checkDownVote = async ({
  voter, author, permlink, guestAuthor, hide = true,
}) => {
  const apps = await getModeratedApps(voter);
  if (_.isEmpty(apps)) return;
  const updateData = hide
    ? { $addToSet: { blocked_for_apps: { $each: apps } } }
    : { $pull: { blocked_for_apps: { $in: apps } } };
  /** Update reblogs */
  await Post.updateMany({ permlink: `${author}/${permlink}` }, updateData);

  return Post.update({
    author: guestAuthor || author,
    permlink,
    ...updateData,
  });
};

exports.addToSiteModeratorsHiddenPosts = async ({ moderator, host }) => {
  const { result: postIds } = await hiddenPostModel.find({
    filter: { userName: moderator },
  });
  if (_.isEmpty(postIds)) return;

  const { result: posts } = await Post.find({
    filter: { _id: { $in: _.map(postIds, 'postId') } },
    projection: {
      author: 1,
      permlink: 1,
    },
  });
  const updateData = { $addToSet: { blocked_for_apps: host } };

  for (const post of posts) {
    const { author, permlink } = post;
    await Post.updateMany({ permlink: `${author}/${permlink}` }, updateData);
    await Post.update({
      author,
      permlink,
      ...updateData,
    });
  }
};

exports.removeFromSiteModeratorsHiddenPosts = async ({ moderator, host }) => {
  const { result: app, error } = await App.findOne({ host });
  if (error) {
    console.error(error);
    return { error };
  }
  const moderatorsList = [
    moderator,
    _.get(app, 'owner'),
    ..._.get(app, 'moderators', []),
  ];

  const { result: postIds } = await hiddenPostModel.find({
    filter: { userName: { $in: moderatorsList } },
  });
  if (_.isEmpty(postIds)) return;

  const deletedModeratorList = _.filter(postIds, (p) => p.userName === moderator);
  if (_.isEmpty(deletedModeratorList)) return;
  const currentModeratorsList = _.filter(postIds, (p) => p.userName !== moderator);

  const postsToRestore = _.difference(
    _.map(deletedModeratorList, 'postId'),
    _.map(currentModeratorsList, 'postId'),
  );

  if (_.isEmpty(postsToRestore)) return;

  const { result: posts } = await Post.find({
    filter: { _id: { $in: postsToRestore } },
    projection: {
      author: 1,
      permlink: 1,
    },
  });

  const updateData = { $pull: { blocked_for_apps: host } };
  for (const post of posts) {
    const { author, permlink } = post;
    await Post.updateMany({ permlink: `${author}/${permlink}` }, updateData);
    await Post.update({
      author,
      permlink,
      ...updateData,
    });
  }
};
