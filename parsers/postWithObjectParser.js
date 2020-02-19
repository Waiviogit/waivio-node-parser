const _ = require('lodash');
const { detectPostLanguageHelper, postHelper } = require('utilities/helpers');
const guestHelpers = require('utilities/guestOperations/guestHelpers');
const { commentRefSetter } = require('utilities/commentRefService');
const { postWithWobjValidator } = require('validator');
const { postsUtil } = require('utilities/steemApi');
const { userHelper } = require('utilities/helpers');
const { Post, Wobj } = require('models');
const { User } = require('models');

const parse = async (operation, metadata, post) => {
  const { user, error: userError } = await userHelper.checkAndCreateUser(operation.author);
  if (userError) console.log(userError.message);
  // get info about guest account(if post had been written from "guest" through proxy bot)
  const guestInfo = await guestHelpers.getFromMetadataGuestInfo({ operation, metadata });
  const data = {
    author: operation.author,
    permlink: operation.permlink,
    wobjects: _.chain(metadata).get('wobj.wobjects', []).filter((w) => w.percent > 0 && w.percent <= 100).value(),
    app: _.isString(metadata.app) ? metadata.app : '',
    author_weight: _.get(user, 'wobjects_weight'),
    guestInfo,
  };

  const result = await createOrUpdatePost(data, post);

  if (_.get(result, 'error')) {
    console.error(result.error);
    return { error: result };
  }
  if (_.get(result, 'updPost')) {
    console.log(`Post with wobjects created by ${operation.author}`);
    return { post: result.updPost };
  }
};

const createOrUpdatePost = async (data, postData) => {
  let result;
  if (!postData) {
    result = await postsUtil.getPost(data.author, data.permlink); // get post from steem api
  } else {
    result = { post: postData };
  }
  if (result.steemError || !result.post || !result.post.author) return { error: result.steemError || `Post @${data.author}/${data.permlink} not found or was deleted!` };

  Object.assign(result.post, data); // assign to post fields wobjects and app

  // validate post data
  if (!postWithWobjValidator.validate({ wobjects: data.wobjects })) return;
  // find post in DB
  //
  const existing = await Post.findOne({
    author: _.get(data, 'guestInfo.userId', data.author),
    permlink: data.permlink,
  });

  if (!existing.post) {
    result.post.active_votes = [];
    result.post._id = postHelper.objectIdFromDateString(result.post.created || Date.now());
    await User.updateOnNewPost(
      _.get(data, 'guestInfo.userId', data.author),
      result.post.created || Date.now(),
    );
  } else {
    result.post.active_votes = result.post.active_votes.map((vote) => ({
      voter: vote.voter,
      weight: Math.round(vote.rshares * 1e-6),
      percent: vote.percent,
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

module.exports = { parse };
