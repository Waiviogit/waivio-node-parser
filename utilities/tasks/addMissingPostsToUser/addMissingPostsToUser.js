const _ = require('lodash');
const { postsUtil } = require('utilities/steemApi');
const { checkAppBlacklistValidity } = require('utilities/helpers').appHelper;
const Sentry = require('@sentry/node');
const { sendSentryNotification } = require('utilities/helpers/sentryHelper');
const UserModel = require('models/UserModel');
const PostModel = require('models/PostModel');
const { reblogPostParser } = require('parsers/userParsers');
const { parseBodyWobjects } = require('utilities/helpers/postHelper');
const { ObjectId } = require('mongoose').Types;

module.exports = async (name) => {
  const { user } = await UserModel.checkAndCreate(name);

  const { posts, err } = await postsUtil.getPostsByAuthor(name);
  if (err) {
    sendSentryNotification();
    Sentry.captureException(err);
  }

  const reblogPosts = _.filter(posts, (post) => post.author !== name);
  for (const reblogPost of reblogPosts) {
    await parseAndSavePost(reblogPost, reblogPost.author);
  }

  for (const post of posts) {
    if (post.author !== name) {
      await reblogPostParser({
        json: ['reblog', { account: name, author: post.author, permlink: post.permlink }],
        account: name,
        fromTask: true,
        id: getIdFromDate(post.created),
      });
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
    sendSentryNotification();
    Sentry.captureException(e);
  }
  if (!(await checkAppBlacklistValidity(metadata))) return;
  if (metadata.app) {
    post.app = metadata.app;
  }

  post.wobjects = await parseBodyWobjects(metadata, post.body);
  post._id = getIdFromDate(post.created);

  const { error } = await PostModel.create(post);
  if (error) {
    sendSentryNotification();
    Sentry.captureException(error);
  }
};

const getIdFromDate = (date) => ObjectId(Math.round(new Date(date).valueOf() / 1000));
