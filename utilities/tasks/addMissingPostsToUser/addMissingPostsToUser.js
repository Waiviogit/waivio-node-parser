const PostModel = require('database').models.Post;
const { postsUtil } = require('utilities/steemApi');

const Sentry = require('@sentry/node');
const { sendSentryNotification } = require('utilities/helpers/sentryHelper');

module.exports = async () => {
  const name = process.argv[2];

  const { posts, err } = await postsUtil.getPostsByAuthor(name);
  if (err || !posts) {
    sendSentryNotification();
    Sentry.captureException(err);
  }

  for (const post of posts) {
    if (await PostModel.findOne(post)) continue;
    const { error } = await PostModel.create(post);
    if (error) console.error(error);
  }
};
