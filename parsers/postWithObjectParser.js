const _ = require('lodash');
const { Post, Wobj, User } = require('models');
const DiffMatchPatch = require('diff-match-patch');
const { postsUtil } = require('utilities/steemApi');
const { postWithWobjValidator } = require('validator');
const { FIELDS_NAMES } = require('constants/wobjectsData');
const { commentRefSetter } = require('utilities/commentRefService');
const { setExpiredPostTTL } = require('utilities/redis/redisSetter');
const guestHelpers = require('utilities/guestOperations/guestHelpers');
const notificationsUtils = require('utilities/notificationsApi/notificationsUtil');
const {
  detectPostLanguageHelper, postHelper, postByTagsHelper, userHelper, appHelper, wobjectHelper,
} = require('utilities/helpers');

const parse = async (operation, metadata, post, fromTTL) => {
  if (!(await appHelper.checkAppBlacklistValidity(metadata))) return { error: '[postWithObjectParser.parse]Dont parse post from not valid app' };
  const isSimplePost = _.isEmpty(_.get(metadata, 'wobj.wobjects'));
  const postTags = _.get(metadata, 'tags', []);

  if (_.isArray(_.get(metadata, 'wobj.wobjects')) && !isSimplePost && postTags.length) {
    let tags = await postByTagsHelper.wobjectsByTags(metadata.tags);
    const wobj = metadata.wobj.wobjects;
    tags = _.filter(tags, (tag) => !_.includes(_.map(wobj, 'author_permlink'), tag.author_permlink));
    _.forEach(tags, (tag) => wobj.push({ author_permlink: tag.author_permlink, percent: 0 }));
    metadata.wobj = { wobjects: wobj || [] };
  } else if (isSimplePost && postTags.length) {
    // case if post has no wobjects, then need add wobjects by tags, or create if it not exist
    const wobjects = await postByTagsHelper.wobjectsByTags(postTags);
    metadata.wobj = { wobjects: wobjects || [] };
  }

  const { user, error: userError } = await userHelper.checkAndCreateUser(operation.author);
  if (userError) console.log(userError.message);
  // get info about guest account(if post had been written from "guest" through proxy bot)
  const guestInfo = await guestHelpers.getFromMetadataGuestInfo({ operation, metadata });
  const data = {
    title: operation.title,
    parent_author: operation.parent_author,
    parent_permlink: operation.parent_permlink,
    author: operation.author,
    permlink: operation.permlink,
    wobjects: _.chain(metadata).get('wobj.wobjects', []).filter((w) => w.percent >= 0 && w.percent <= 100).value(),
    app: _.isString(metadata.app) ? metadata.app : '',
    author_weight: _.get(user, 'wobjects_weight'),
    json_metadata: operation.json_metadata,
    body: operation.body,
    root_author: operation.author,
    guestInfo,
  };

  const result = await createOrUpdatePost(data, post, fromTTL);

  if (_.get(result, 'error')) {
    console.error(result.error);
    return { error: result.error };
  }
  if (_.get(result, 'updPost')) {
    console.log(`Post with wobjects ${result.action} by ${operation.author}`);
    return { post: result.updPost };
  }
};

const createOrUpdatePost = async (data, postData, fromTTL) => {
  let hivePost, err;
  const author = _.get(data, 'guestInfo.userId', data.author);
  const { post } = await Post.findOne({ author, permlink: data.permlink });

  if (!postData && post) {
    ({ post: hivePost, err } = await postsUtil.getPost(data.author, data.permlink));
  } else if (postData) {
    hivePost = postData;
  }
  if (err) return { error: err.message };

  const postAuthor = _.get(hivePost, 'author');
  if (post && !postAuthor) {
    if (!fromTTL) {
      return setExpiredPostTTL('notFoundPost', `${data.author}/${data.permlink}`, 15);
    }
    return { error: `[createOrUpdatePost] Post @${data.author}/${data.permlink} not found or was deleted!` };
  }

  if (post) {
    if (!data.body) data.body = hivePost.body;
    if (!data.json_metadata) data.json_metadata = hivePost.json_metadata;
  }
  if (post || postData) Object.assign(hivePost, data);
  // validate post data
  if (!postWithWobjValidator.validate({ wobjects: data.wobjects })) {
    return { validationError: true };
  }

  let updPost, error;
  if (!post && !postData) {
    const { notificationData } = await addWobjectNames(_.cloneDeep(data));
    await notificationsUtils.post(notificationData);
    data.active_votes = [];
    data._id = postHelper.objectIdFromDateString(Date.now());
    await User.updateOnNewPost(author, Date.now());

    await setExpiredPostTTL('hivePost', `${author}/${data.permlink}`, 605000);
    data.language = await detectPostLanguageHelper(data);
    data.author = author;

    await commentRefSetter.addPostRef(
      `${data.root_author}_${data.permlink}`,
      data.wobjects, _.get(data, 'guestInfo.userId'),
    );
    ({ result: updPost, error } = await Post.update(data));
    if (error) return { error };
    for (const authorPermlink of data.wobjects.map((w) => w.author_permlink)) {
      await Wobj.pushNewPost({ author_permlink: authorPermlink, post_id: updPost._id });
    }
    return { updPost, action: 'created' };
  }
  const hiveVoters = _.map(hivePost.active_votes, (el) => el.voter);

  if (post) {
    _.forEach(post.active_votes, (el) => {
      if (!_.includes(hiveVoters, el.voter)) hivePost.active_votes.push(el);
    });
    hivePost.body = hivePost.body.substr(0, 2) === '@@'
      ? mergePosts(post.body, hivePost.body)
      : hivePost.body;
  } else hivePost._id = postHelper.objectIdFromDateString(hivePost.created);

  hivePost.active_votes = hivePost.active_votes.map((vote) => ({
    voter: vote.voter,
    weight: Math.round(vote.rshares * 1e-6),
    percent: vote.percent,
    rshares: vote.rshares,
  }));
  hivePost.language = await detectPostLanguageHelper(hivePost);
  hivePost.author = author;

  ({ result: updPost, error } = await Post.update(hivePost));
  if (error) return { error };
  await commentRefSetter.addPostRef(
    `${data.root_author}_${data.permlink}`,
    data.wobjects, _.get(data, 'guestInfo.userId'),
  );
  return { updPost, action: 'updated' };
};

const mergePosts = (originalBody, body) => {
  try {
    const dmp = new DiffMatchPatch();
    const patches = dmp.patch_fromText(body);
    const [updatedPost] = dmp.patch_apply(patches, originalBody);
    return updatedPost;
  } catch (error) {
    return body;
  }
};

const addWobjectNames = async (notificationData) => {
  if (_.isEmpty(notificationData.wobjects)) return { notificationData };
  for (const wobject of notificationData.wobjects) {
    const field = await wobjectHelper
      .getWobjWinField({ authorPermlink: wobject.author_permlink, fieldName: FIELDS_NAMES.NAME });
    wobject.name = _.get(field, 'body', wobject.objectName);
  }
  return { notificationData };
};

module.exports = { parse, createOrUpdatePost };
