const _ = require('lodash');
const moment = require('moment');
const config = require('config');
const {
  Post, Wobj, User, App, mutedUserModel,
} = require('models');
const DiffMatchPatch = require('diff-match-patch');
const { postsUtil } = require('utilities/steemApi');
const { postWithWobjValidator } = require('validator');
const { FIELDS_NAMES } = require('constants/wobjectsData');
const { commentRefSetter } = require('utilities/commentRefService');
const { setExpiredPostTTL } = require('utilities/redis/redisSetter');
const guestHelpers = require('utilities/guestOperations/guestHelpers');
const notificationsUtils = require('utilities/notificationsApi/notificationsUtil');
const {
  detectPostLanguageHelper, userHelper, appHelper, wobjectHelper, postHelper,
} = require('utilities/helpers');

const parse = async (operation, metadata, post, fromTTL) => {
  if (!(await appHelper.checkAppBlacklistValidity(metadata))) return { error: '[postWithObjectParser.parse]Dont parse post from not valid app' };

  const { user, error: userError } = await userHelper.checkAndCreateUser(operation.author);
  if (userError) console.log(userError.message);
  // get info about guest account(if post had been written from "guest" through proxy bot)
  const guestInfo = await guestHelpers.getFromMetadataGuestInfo({ operation, metadata });
  const author = _.get(guestInfo, 'userId', operation.author);
  // find apps where author is muted
  const { mutedUsers } = await mutedUserModel.find({ userName: author });
  const blockedForApps = _.reduce(mutedUsers, (acc, value) => _.union(acc, value.mutedForApps), []);

  const data = {
    title: operation.title,
    parent_author: operation.parent_author,
    parent_permlink: operation.parent_permlink,
    author,
    permlink: operation.permlink,
    app: _.isString(metadata.app) ? metadata.app : '',
    author_weight: _.get(user, 'wobjects_weight'),
    json_metadata: operation.json_metadata,
    body: operation.body,
    root_author: operation.author,
    blocked_for_apps: blockedForApps,
    guestInfo, // do we need this field?
  };
  const result = await createOrUpdatePost(data, post, fromTTL, metadata);

  if (_.get(result, 'error')) {
    console.error(result.error);
    return { error: result.error };
  }
  if (_.get(result, 'updPost')) {
    console.log(`Post with wobjects ${result.action} by ${operation.author}`);
    return { post: result.updPost };
  }
};

const createOrUpdatePost = async (data, postData, fromTTL, metadata) => {
  let hivePost, err;
  const { post } = await Post.findOne({ author: data.author, permlink: data.permlink });

  let updPost, error;
  if (!post) {
    data.wobjects = await postHelper.parseBodyWobjects(metadata, data.body);
    // validate post data
    if (!postWithWobjValidator.validate({ wobjects: data.wobjects })) {
      return { validationError: true };
    }
    data.depth = 0;
    data.reblogged_by = [];
    data.root_title = data.title;
    data.language = await detectPostLanguageHelper(data);
    data.created = moment().format('YYYY-MM-DDTHH:mm:ss');
    data.cashout_time = moment().add(7, 'days').toISOString();
    data.url = `/${data.parent_permlink}/@${data.root_author}/${data.permlink}`;

    await User.updateOnNewPost(data.author, Date.now());
    await setExpiredPostTTL('hivePost', `${data.author}/${data.permlink}`, 605000);
    await commentRefSetter.addPostRef(
      `${data.root_author}_${data.permlink}`,
      data.wobjects, _.get(data, 'guestInfo.userId'),
    );
    ({ result: updPost, error } = await Post.update(data));
    if (error) return { error };
    for (const authorPermlink of data.wobjects.map((w) => w.author_permlink)) {
      await Wobj.pushNewPost({ author_permlink: authorPermlink, post_id: updPost._id });
    }
    const { notificationData } = await addWobjectNames(_.cloneDeep(data));
    await notificationsUtils.post(notificationData);
    await postHelper.addToRelated(data.wobjects, metadata.image, `${data.author}_${data.permlink}`);
    return { updPost, action: 'created' };
  }

  if (!postData) {
    ({ post: hivePost, err } = await postsUtil.getPost(data.root_author, data.permlink));
  } else if (postData) {
    hivePost = postData;
  }
  const postAuthor = _.get(hivePost, 'author');
  if (!postAuthor || err) {
    if (!fromTTL) {
      return setExpiredPostTTL('notFoundPost', `${data.root_author}/${data.permlink}`, 30);
    }
    return { error: `[createOrUpdatePost] Post @${data.root_author}/${data.permlink} not found or was deleted!` };
  }

  if (!data.body) data.body = hivePost.body;
  if (!data.json_metadata) data.json_metadata = hivePost.json_metadata;
  Object.assign(hivePost, data);

  const hiveVoters = _.map(hivePost.active_votes, (el) => el.voter);

  _.forEach(post.active_votes, (el) => {
    if (!_.includes(hiveVoters, el.voter)) hivePost.active_votes.push(el);
  });
  hivePost.body = hivePost.body.substr(0, 2) === '@@'
    ? mergePosts(post.body, hivePost.body)
    : hivePost.body;
  hivePost.wobjects = await postHelper.parseBodyWobjects(metadata, hivePost.body);

  // validate post data
  if (!postWithWobjValidator.validate({ wobjects: hivePost.wobjects })) {
    return { validationError: true };
  }
  hivePost.active_votes = hivePost.active_votes.map((vote) => ({
    voter: vote.voter,
    weight: Math.round(vote.rshares * 1e-6),
    percent: vote.percent,
    rshares: vote.rshares,
  }));
  hivePost.language = await detectPostLanguageHelper(hivePost);
  hivePost.author = data.author;

  ({ result: updPost, error } = await Post.update(hivePost));
  if (error) return { error };
  await commentRefSetter.addPostRef(
    `${data.root_author}_${data.permlink}`,
    hivePost.wobjects, _.get(data, 'guestInfo.userId'),
  );
  await postHelper.addToRelated(hivePost.wobjects, metadata.image, `${data.author}_${data.permlink}`);
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
  const { result } = await Wobj.find({ author_permlink: { $in: _.map(notificationData.wobjects, 'author_permlink') } });
  const { result: app } = await App.findOne({ host: config.appHost });
  const processed = await wobjectHelper
    .processWobjects({ wobjects: result, fields: [FIELDS_NAMES.NAME], app });
  for (const wobject of notificationData.wobjects) {
    /**
     * in the case when hashtag is attached to the post we can take wobject name
     * from tagged property, in case it regular object get name from objectName property
     */
    const wobjWithName = _.find(processed, (w) => w.author_permlink === wobject.author_permlink);
    wobject.name = _.get(wobjWithName, 'name', _.get(wobjWithName, 'default_name', wobject.tagged || wobject.objectName));
  }
  return { notificationData };
};

module.exports = {
  parse, createOrUpdatePost, addWobjectNames,
};
