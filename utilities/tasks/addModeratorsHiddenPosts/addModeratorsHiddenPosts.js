const { App, Post, hiddenPostModel } = require('models');
const _ = require('lodash');

const addToSiteModeratorsHiddenPosts = async (moderator) => {
  const { apps, error } = await App.findByModeration(moderator);
  if (error) {
    console.error(error);
    return { error };
  }
  const { result: postIds } = await hiddenPostModel.find({
    filter: { userName: moderator },
  });

  const { result: posts } = await Post.find({
    filter: { _id: { $in: _.map(postIds, 'postId') } },
    projection: {
      author: 1,
      permlink: 1,
    },
  });
  const updateData = { $addToSet: { blocked_for_apps: { $each: _.map(apps, (a) => a.host) } } };

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

const addHiddenPosts = async () => {
  const { result } = await App.find({}, { owner: 1, moderators: 1 });

  const moderators = _.compact(
    _.uniq(
      _.reduce(result, (acc, el) => [...acc, el.owner, ...el.moderators], []),
    ),
  );

  for (const moderator of moderators) await addToSiteModeratorsHiddenPosts(moderator);

  console.info('task completed');
};

module.exports = addHiddenPosts;
