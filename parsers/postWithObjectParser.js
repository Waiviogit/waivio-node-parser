const _ = require('lodash');
const { detectPostLanguageHelper, postHelper, postByTagsHelper } = require('utilities/helpers');
const guestHelpers = require('utilities/guestOperations/guestHelpers');
const { commentRefSetter } = require('utilities/commentRefService');
const { postWithWobjValidator } = require('validator');
const { postsUtil } = require('utilities/steemApi');
const { userHelper } = require('utilities/helpers');
const { Post, Wobj } = require('models');
const { User } = require('models');
const notificationsUtils = require('utilities/notificationsApi/notificationsUtil');
const { setExpiredPostTTL } = require('utilities/redis/redisSetter');
const { checkAppBlacklistValidity } = require('utilities/helpers').appHelper;

const parse = async (operation, metadata, post, fromTTL) => {
  if (!(await checkAppBlacklistValidity(metadata))) return { error: '[postWithObjectParser.parse]Dont parse post from not valid app' };

  if (_.isArray(_.get(metadata, 'wobj.wobjects'))
      && !_.isEmpty(_.get(metadata, 'wobj.wobjects')) && _.get(metadata, 'tags', []).length) {
    let tags = await postByTagsHelper.wobjectsByTags(metadata.tags);
    const wobj = metadata.wobj.wobjects;
    tags = _.filter(tags, (tag) => !_.includes(_.map(wobj, 'author_permlink'), tag.author_permlink));
    _.forEach(tags, (tag) => wobj.push({ author_permlink: tag.author_permlink, percent: 0 }));
    metadata.wobj = { wobjects: wobj || [] };
  } else if (_.isEmpty(_.get(metadata, 'wobj.wobjects')) && _.get(metadata, 'tags', []).length) {
    // case if post has no wobjects, then need add wobjects by tags, or create if it not exist
    const wobjects = await postByTagsHelper.wobjectsByTags(_.get(metadata, 'tags', []));
    metadata.wobj = { wobjects: wobjects || [] };
  }

  const { user, error: userError } = await userHelper.checkAndCreateUser(operation.author);
  if (userError) console.log(userError.message);
  // get info about guest account(if post had been written from "guest" through proxy bot)
  const guestInfo = await guestHelpers.getFromMetadataGuestInfo({ operation, metadata });
  const data = {
    author: operation.author,
    permlink: operation.permlink,
    wobjects: _.chain(metadata).get('wobj.wobjects', []).filter((w) => w.percent >= 0 && w.percent <= 100).value(),
    app: _.isString(metadata.app) ? metadata.app : '',
    author_weight: _.get(user, 'wobjects_weight'),
    json_metadata: operation.json_metadata,
    body: operation.body,
    guestInfo,
  };

  const result = await createOrUpdatePost(data, post, fromTTL);

  if (_.get(result, 'error')) {
    console.error(result.error);
    return { error: result };
  }
  if (_.get(result, 'updPost')) {
    console.log(`Post with wobjects created by ${operation.author}`);
    return { post: result.updPost };
  }
};

const createOrUpdatePost = async (data, postData, fromTTL) => {
  let result;
  if (!postData) {
    result = await postsUtil.getPost(data.author, data.permlink); // get post from hive api
  } else {
    result = { post: postData };
  }
  if (result.steemError) return { error: result.steemError };
  if ((!result.post || !result.post.author) && !fromTTL) {
    return setExpiredPostTTL('notFoundPost', `${data.author}/${data.permlink}`, 15);
  } if ((!result.post || !result.post.author) && fromTTL) {
    return { error: `[createOrUpdatePost] Post @${data.author}/${data.permlink} not found or was deleted!` };
  }

  if (!data.body) data.body = result.post.body;
  if (!data.json_metadata) data.json_metadata = result.post.json_metadata;
  Object.assign(result.post, data); // assign to post fields wobjects and app

  // validate post data
  if (!postWithWobjValidator.validate({ wobjects: data.wobjects })) return;
  // find post in DB

  const existing = await Post.findOne({
    author: _.get(data, 'guestInfo.userId', data.author),
    permlink: data.permlink,
  });

  if (!existing.post) {
    await notificationsUtils.post(data, postData || result.post);
    result.post.active_votes = [];
    result.post._id = postHelper.objectIdFromDateString(result.post.created || Date.now());
    await User.updateOnNewPost(
      _.get(data, 'guestInfo.userId', data.author),
      result.post.created || Date.now(),
    );
    await setExpiredPostTTL('hivePost', `${_.get(data, 'guestInfo.userId', data.author)}/${data.permlink}`, 605000);
  } else {
    const hiveVoters = _.map(result.post.active_votes, (el) => el.voter);
    _.forEach(existing.post.active_votes, (el) => {
      if (!_.includes(hiveVoters, el.voter)) result.post.active_votes.push(el);
    });
    result.post.active_votes = result.post.active_votes.map((vote) => ({
      voter: vote.voter,
      weight: Math.round(vote.rshares * 1e-6),
      percent: vote.percent,
      rshares: vote.rshares,
    }));
  }
  // add language to post
  result.post.language = await detectPostLanguageHelper(result.post);
  // set reference "post_with_wobj"
  await commentRefSetter.addPostRef(
    `${data.author}_${data.permlink}`,
    data.wobjects, _.get(data, 'guestInfo.userId'),
  );
  // if post from guest user, in DB post save with {author: guest_user_name}
  result.post.author = _.get(data, 'guestInfo.userId', data.author);
  const { result: updPost, error } = await Post.update(result.post);
  if (error) return { error };

  if (!existing.post) {
    for (const authorPermlink of data.wobjects.map((w) => w.author_permlink)) {
      await Wobj.pushNewPost({ author_permlink: authorPermlink, post_id: updPost._id });
    }
  }
  return { updPost };
};

module.exports = { parse, createOrUpdatePost };
