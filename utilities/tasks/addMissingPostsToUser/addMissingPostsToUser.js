const _ = require('lodash');
const { postsUtil } = require('utilities/steemApi');
const { checkAppBlacklistValidity } = require('utilities/helpers').appHelper;
const Sentry = require('@sentry/node');
const { sendSentryNotification } = require('utilities/helpers/sentryHelper');
const UserModel = require('models/UserModel');
const PostModel = require('models/PostModel');
const { reblogPostParser } = require('parsers/userParsers');
const { parseBodyWobjects } = require('../../helpers/postHelper');

module.exports = async (name) => {
  const { user } = await UserModel.checkAndCreate(name);
  user.wobjects_weight = 25000;

  const { posts, err } = await postsUtil.getPostsByAuthor(name);
  if (err || !posts) {
    sendSentryNotification();
    Sentry.captureException(err);
  }

  const reblogPosts = _.reject(posts, { author: name });
  reblogPosts.forEach((post) => parseAndSavePost(post, post.author));

  for (const post of posts) {
    if (post.author !== name) {
      const json = ['reblog', { account: name, author: post.author, permlink: post.permlink }];
      await reblogPostParser({ json, account: { name }, fromTask: true });
    } else {
      await parseAndSavePost(post, user);
    }
  }
};

const parseAndSavePost = async (post, user) => {
  let metadata;
  const { post: existPost } = await PostModel.findOne(post);
  if (existPost) return;
  post.author_weight = _.get(user, 'wobjects_weight', 0);

  try {
    metadata = JSON.parse(post.json_metadata);
  } catch (e) {
    console.error(e);
  }
  if (!(await checkAppBlacklistValidity(metadata))) return;

  post.app = metadata.app;
  post.wobjects = await parseBodyWobjects(metadata, post.body);

  const { error } = await PostModel.create(post);
  if (error) console.error(error);
};
