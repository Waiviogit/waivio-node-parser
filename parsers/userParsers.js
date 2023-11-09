const _ = require('lodash');
const {
  User, Post, Subscriptions, wobjectSubscriptions,
  hiddenPostModel, hiddenCommentModel, mutedUserModel,
} = require('models');
const {
  BELL_NOTIFICATIONS, HIDE_ACTION, REQUIRED_AUTHS,
  REQUIRED_POSTING_AUTHS, CUSTOM_JSON_OPS, MUTE_ACTION,
} = require('constants/parsersData');
const notificationsUtil = require('utilities/notificationsApi/notificationsUtil');
const { validateProxyBot } = require('utilities/guestOperations/guestHelpers');
const postModeration = require('utilities/moderation/postModeration');
const sitesHelper = require('utilities/helpers/sitesHelper');
const jsonHelper = require('utilities/helpers/jsonHelper');
const postUtil = require('utilities/helpers/postHelper');
const { postsUtil } = require('utilities/steemApi');
const { ERROR } = require('constants/common');

exports.updateAccountParser = async (operation) => {
  if (operation.account && operation.owner && operation.active && operation.posting && operation.memo_key) {
    await notificationsUtil.custom({ account: operation.account, id: 'changePassword' });
  }
  if (operation.account && (operation.json_metadata || operation.posting_json_metadata)) {
    let parsedMetadata, parsedPostingMetadata;

    try {
      parsedMetadata = operation.json_metadata
        ? JSON.parse(operation.json_metadata)
        : null;
      parsedPostingMetadata = operation.posting_json_metadata
        ? JSON.parse(operation.posting_json_metadata)
        : null;
    } catch (err) {
      console.error(`Not valid metadata on user ${operation.account}`);
    }

    const updateData = parsedPostingMetadata
      ? {
        posting_json_metadata: operation.posting_json_metadata,
        alias: _.get(parsedPostingMetadata, 'profile.name', ''),
        profile_image: _.get(parsedPostingMetadata, 'profile.profile_image'),
      }
      : {
        json_metadata: operation.json_metadata,
        alias: _.get(parsedMetadata, 'profile.name', ''),
        profile_image: _.get(parsedMetadata, 'profile.profile_image'),
      };

    const { result, error } = await User.updateOne(
      { name: operation.account },
      { ...updateData },
    );

    if (error) {
      console.error(error.message);
    } else if (result) {
      console.log(`User ${operation.account} update "json_metadata"`);
    }
  }
};

/**
 * Create user in db after operation like "create_claimed_account" or "create_account"
 * @param data
 * @returns {Promise<void>}
 */
exports.createUser = async (data) => {
  // await checkAndCreateUser(data.new_account_name);
  await User.checkAndCreate(data.new_account_name);
};

exports.followUserParser = async (operation) => {
  const json = jsonHelper.parseJson(operation.json);
  if (_.isEmpty(json)) return console.error(ERROR.INVALID_JSON);
  // check author of operation and user which will be updated
  if (_.get(json, '[0]') === 'reblog' && _.get(operation, REQUIRED_POSTING_AUTHS, _.get(operation, REQUIRED_AUTHS)) !== _.get(json, '[1].account')) {
    console.error(ERROR.FOLLOW_USER_PARSER_REBLOG);
    return;
  } if (_.get(json, '[0]') === 'follow' && _.get(operation, REQUIRED_POSTING_AUTHS, _.get(operation, REQUIRED_AUTHS)) !== _.get(json, '[1].follower')) {
    console.error(ERROR.FOLLOW_USER_PARSER_FOLLOW_DIFFERENT);
    return;
  }
  if (_.get(json, '[0]') === 'follow' && _.get(json, '[1].what') && _.get(json, '[1].follower') === _.get(json, '[1].following')) {
    console.error(ERROR.FOLLOW_USER_PARSER_FOLLOW_SAME);
    return;
  }

  if (_.get(json, '[0]') === 'reblog') {
    await this.reblogPostParser({ json, account: _.get(operation, REQUIRED_POSTING_AUTHS) });
  }
  if (_.get(json, '[0]') === 'follow' && _.get(json, '[1].follower') && _.get(json, '[1].following') && _.get(json, '[1].what')) {
    const { user } = await Subscriptions.findOne(json[1]);
    if (_.get(json, '[1].what[0]') === 'blog' && !user) { // if field "what" present - it's follow on user
      const { result } = await User.addUserFollow(json[1]);
      const { result: muted } = await mutedUserModel.findOne({
        mutedBy: _.get(json, '[1].follower'),
        userName: _.get(json, '[1].following'),
      });

      await Subscriptions.followUser(json[1]);
      if (result) await notificationsUtil.follow(json[1]);
      if (muted) await sitesHelper.mutedUsers({ ...json[1], action: MUTE_ACTION.UNMUTE });
    } else if (_.get(json, '[1].what[0]') === 'ignore') { // mute user
      await sitesHelper.mutedUsers({ ...json[1], action: MUTE_ACTION.MUTE });
      if (user) await removeUserSubscription(json[1]);
    } else if (_.isEmpty(_.get(json, '[1].what[0]'))) { // _.isEmpty what and user - unfollow
      await sitesHelper.mutedUsers({ ...json[1], action: MUTE_ACTION.UNMUTE });
      if (user) await removeUserSubscription(json[1]);
    }
  }
};

const removeUserSubscription = async (data) => {
  await User.removeUserFollow(data);
  await Subscriptions.unfollowUser(data);
};

exports.reblogPostParser = async ({
  json, account, id, fromTask = false,
}) => {
  const author = _.get(json, '[1].author');
  const permlink = _.get(json, '[1].permlink');
  if (author && permlink && account && account !== author) {
    const { post, error } = await Post.findByBothAuthors({
      author: _.get(json, '[1].author'),
      permlink: _.get(json, '[1].permlink'),
    });
    if (error || !post) return { error: error || `Post ${ERROR.NOT_FOUND}` };
    const data = {
      author: account, // person who make reblog
      root_author: account, // person who make reblog
      permlink: `${_.get(post, 'author')}/${_.get(json, '[1].permlink')}`,
      reblog_to: {
        author: _.get(post, 'author'), // author of source post
        permlink: _.get(json, '[1].permlink'), // permlink of source post
      },
      body: '',
      json_metadata: '',
      ..._.pick(post, ['language', 'wobjects', 'id', 'blocked_for_apps']),
    };
    if (id) data._id = id;
    const { post: createdPost, error: createPostError } = await Post.create(data);

    if (createPostError) return { error: createPostError };
    const updateData = {
      author: post.author,
      permlink,
      $addToSet: { reblogged_users: account },
    };
    if (!fromTask) {
      await notificationsUtil.reblog({
        account: json[1].account, author: post.author, permlink: post.permlink, title: post.title,
      });
    }
    await Post.update(updateData);
    if (createdPost) console.log(`User ${account} reblog post @${json[1].author}/${json[1].permlink}!`);
  }
};

exports.subscribeNotificationsParser = async (operation) => {
  const json = jsonHelper.parseJson(operation.json);
  if (_.isEmpty(json)) return console.error(ERROR.INVALID_JSON);

  if (_.get(operation, REQUIRED_POSTING_AUTHS, _.get(operation, REQUIRED_AUTHS)) !== _.get(json, '[1].follower')) {
    return console.error(ERROR.SUBSCRIBE_NOTIFICATIONS);
  }
  const { follower, following, subscribe } = json[1];

  switch (json[0]) {
    case BELL_NOTIFICATIONS.USER:
      const { user } = await Subscriptions.findOne({ follower, following });
      if (!user) return;
      return Subscriptions
        .updateOne({ condition: { follower, following }, updateData: { bell: subscribe } });
    case BELL_NOTIFICATIONS.WOBJECT:
      const { user: wobjSubs } = await wobjectSubscriptions.findOne({ follower, following });
      if (!wobjSubs) return;
      return wobjectSubscriptions
        .updateOne({ condition: { follower, following }, updateData: { bell: subscribe } });
  }
};

exports.hidePostParser = async (operation) => {
  const json = jsonHelper.parseJson(operation.json);
  if (_.isEmpty(json)) return console.error(ERROR.INVALID_JSON);

  const { author, permlink, action } = json;
  const userName = _.get(operation, REQUIRED_POSTING_AUTHS, _.get(operation, REQUIRED_AUTHS));
  const { post } = await Post.findOne({ author, permlink });
  if (!post || !userName) return console.error(ERROR.HIDE_POST);

  switch (action) {
    case HIDE_ACTION.HIDE:
      await hiddenPostModel.update({ userName, postId: post._id });
      await postModeration.checkDownVote({ voter: userName, author, permlink });
      break;
    case HIDE_ACTION.UNHIDE:
      await hiddenPostModel.deleteOne({ userName, postId: post._id });
      await postModeration.checkDownVote({
        voter: userName, author, permlink, hide: false,
      });
      break;
  }
};

exports.hideCommentParser = async (operation) => {
  const json = jsonHelper.parseJson(operation.json);
  if (_.isEmpty(json)) return console.error(ERROR.INVALID_JSON);

  // guestName - name of user who doing hide (not matter is hive or guest user)
  const {
    author, permlink, action, guestName: hidingUser,
  } = json;
  const userName = _.get(operation, REQUIRED_POSTING_AUTHS, _.get(operation, REQUIRED_AUTHS));
  if (!userName) return console.error(ERROR.HIDE_POST);

  switch (action) {
    case HIDE_ACTION.HIDE:
      await hiddenCommentModel.update({ userName, author, permlink });
      const { post: comment } = await postsUtil.getPost(author, permlink);
      if (!comment) return;
      const { post: dbPost } = await Post.findOne({
        root_author: comment.root_author, permlink: comment.root_permlink,
      });
      if (hidingUser !== dbPost.author) return;
      await postUtil.hideCommentWobjectsFromPost({
        body: comment.body,
        author: comment.root_author,
        permlink: comment.root_permlink,
      });
      break;
    case HIDE_ACTION.UNHIDE:
      await hiddenCommentModel.deleteOne({ userName, author, permlink });
      break;
  }
};

exports.guestHideContentParser = async (operation) => {
  if (await validateProxyBot(_.get(operation, REQUIRED_POSTING_AUTHS, _.get(operation, REQUIRED_AUTHS)))) {
    const json = jsonHelper.parseJson(operation.json);
    if (_.isEmpty(json)) return console.error(ERROR.INVALID_JSON);

    operation.required_posting_auths = [_.get(json, 'guestName')];

    switch (operation.id) {
      case CUSTOM_JSON_OPS.GUEST_HIDE_POST:
        return this.hidePostParser(operation);
      case CUSTOM_JSON_OPS.GUEST_HIDE_COMMENT:
        return this.hideCommentParser(operation);
    }
  }
};

const userFieldMappings = {
  update_proposal_votes: (el) => el[1]?.voter,
  vote: (el) => el[1]?.voter,
  vote2: (el) => el[1]?.voter,
  delete_comment: (el) => el[1]?.author,
  comment: (el) => el[1]?.author,
  transfer: (el) => el[1]?.from,
  recurrent_transfer: (el) => el[1]?.from,
  transfer_to_vesting: (el) => el[1]?.from,
  escrow_transfer: (el) => el[1]?.from,
  escrow_dispute: (el) => el[1]?.from,
  escrow_release: (el) => el[1]?.from,
  escrow_approve: (el) => el[1]?.from,
  transfer_to_savings: (el) => el[1]?.from,
  transfer_from_savings: (el) => el[1]?.from,
  cancel_transfer_from_savings: (el) => el[1]?.from,
  custom: (el) => el[1].required_auths[0] || el[1].required_posting_auths[0],
  custom_json: (el) => el[1].required_auths[0] || el[1].required_posting_auths[0],
  withdraw_vesting: (el) => el[1]?.account,
  claim_reward_balance: (el) => el[1]?.account,
  account_update: (el) => el[1]?.account,
  account_witness_vote: (el) => el[1]?.account,
  account_witness_proxy: (el) => el[1]?.account,
  decline_voting_rights: (el) => el[1]?.account,
  claim_reward_balance2: (el) => el[1]?.account,
  account_create: (el) => el[1]?.creator,
  claim_account: (el) => el[1]?.creator,
  create_claimed_account: (el) => el[1]?.creator,
  account_create_with_delegation: (el) => el[1]?.creator,
  create_proposal: (el) => el[1]?.creator,
  remove_proposal: (el) => el[1]?.creator,
  update_proposal: (el) => el[1]?.creator,
  feed_publish: (el) => el[1]?.publisher,
  delegate_vesting_shares: (el) => el[1]?.delegator,
  set_withdraw_vesting_route: (el) => el[1]?.from_account,
  limit_order_cancel: (el) => el[1]?.owner,
  limit_order_create: (el) => el[1]?.owner,
  convert: (el) => el[1]?.owner,
  witness_set_properties: (el) => el[1]?.owner,
  witness_update: (el) => el[1]?.owner,
  limit_order_create2: (el) => el[1]?.owner,
  fill_convert_request: (el) => el[1]?.owner,
  default: () => '',
};

exports.updateLastActivity = async ({ transactions, timestamp }) => {
  console.time('updateLastActivity');
  const users = _
    .chain(transactions)
    .map((t) => t.operations)
    .flatten()
    .map((el) => (userFieldMappings[el[0]] || userFieldMappings.default)(el))
    .compact()
    .uniq()
    .value();

  await User.update({ name: { $in: users } }, { lastActivity: new Date(timestamp) });
  console.timeEnd('updateLastActivity');
};
