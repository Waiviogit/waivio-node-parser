const _ = require('lodash');
const {
  User, Post, Subscriptions, wobjectSubscriptions,
} = require('models');
const notificationsUtil = require('utilities/notificationsApi/notificationsUtil');
const { BELL_NOTIFICATIONS } = require('constants/parsersData');

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
      console.error(error);
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
  let json;
  try {
    json = JSON.parse(operation.json);
  } catch (error) {
    console.error(error);
    return;
  }
  // check author of operation and user which will be updated
  if (_.get(json, '[0]') === 'reblog' && _.get(operation, 'required_posting_auths[0]', _.get(operation, 'required_auths')) !== _.get(json, '[1].account')) {
    console.error('Can\'t reblog, account and author of operation are different');
    return;
  } if (_.get(json, '[0]') === 'follow' && _.get(operation, 'required_posting_auths[0]', _.get(operation, 'required_auths')) !== _.get(json, '[1].follower')) {
    console.error('Can\'t follow(reblog), follower(account) and author of operation are different');
    return;
  }
  if (_.get(json, '[0]') === 'follow' && _.get(json, '[1].what') && _.get(json, '[1].follower') === _.get(json, '[1].following')) {
    console.error('Can\'t follow, follower and following are the same');
    return;
  }

  if (_.get(json, '[0]') === 'reblog') {
    await this.reblogPostParser({ json, account: _.get(operation, 'required_posting_auths[0]') });
  }
  if (_.get(json, '[0]') === 'follow' && _.get(json, '[1].follower') && _.get(json, '[1].following') && _.get(json, '[1].what')) {
    const { user } = await Subscriptions.findOne(json[1]);
    if (_.get(json, '[1].what[0]') === 'blog' && !user) { // if field "what" present - it's follow on user
      const { result } = await User.addUserFollow(json[1]);
      await Subscriptions.followUser(json[1]);
      if (result) {
        await notificationsUtil.follow(json[1]);
        console.log(`User ${json[1].follower} now following user ${json[1].following}!`);
      }
    } else if (_.get(json, '[1].what[0]') !== 'blog' && user) { // else if missing - unfollow
      const { result } = await User.removeUserFollow(json[1]);
      await Subscriptions.unfollowUser(json[1]);
      if (result) {
        console.log(`User ${json[1].follower} now unfollow user ${json[1].following} !`);
      }
    }
  }
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
    if (error) return { error };
    const data = {
      author: account, // person who make reblog
      permlink: `${_.get(json, '[1].author')}/${_.get(json, '[1].permlink')}`,
      reblog_to: {
        author: _.get(json, '[1].author'), // author of source post
        permlink: _.get(json, '[1].permlink'), // permlink of source post
      },
      body: '',
      json_metadata: '',
      ..._.pick(post, ['language', 'wobjects', 'id']),
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
  let json;
  try {
    json = JSON.parse(operation.json);
  } catch (error) {
    console.error(error);
  }
  if (_.get(operation, 'required_posting_auths[0]', _.get(operation, 'required_auths')) !== _.get(json, '[1].follower')) {
    console.error('Can\'t subscribe for notifications, account and author of operation are different');
    return;
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
