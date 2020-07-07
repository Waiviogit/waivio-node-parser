const _ = require('lodash');
const { User, Post, Subscriptions } = require('models');
const notificationsUtil = require('utilities/notificationsApi/notificationsUtil');

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
        alias: _.get(parsedPostingMetadata, 'profile.name', null),
        profile_image: _.get(parsedPostingMetadata, 'profile.profile_image'),
      }
      : {
        json_metadata: operation.json_metadata,
        alias: _.get(parsedMetadata, 'profile.name', null),
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
    const { users: followers } = await Subscriptions.getFollowings({ follower: json[1].follower });
    if (_.get(json, '[1].what[0]') === 'blog' // if field "what" present - it's follow on user
        && (followers && !_.includes(followers, json[1].following))) {
      const { result } = await User.addUserFollow(json[1]);
      await Subscriptions.followUser(json[1]);
      if (result) {
        await notificationsUtil.follow(json[1]);
        console.log(`User ${json[1].follower} now following user ${json[1].following}!`);
      }
    } else if (_.get(json, '[1].what[0]') !== 'blog' // else if missing - unfollow
        && (followers && _.includes(followers, json[1].following))) {
      const { result } = await User.removeUserFollow(json[1]);
      await Subscriptions.unfollowUser(json[1]);
      if (result) {
        console.log(`User ${json[1].follower} now unfollow user ${json[1].following} !`);
      }
    }
  }
};

exports.reblogPostParser = async ({ json, account }) => {
  const author = _.get(json, '[1].author');
  const permlink = _.get(json, '[1].permlink');
  if (author && permlink && account && account !== author) {
    const { post, error } = await Post.findByBothAuthors({
      author: _.get(json, '[1].author'),
      permlink: _.get(json, '[1].permlink'),
    });
    if (error) return { error };
    const { post: createdPost, error: createPostError } = await Post
      .create({
        author: account, // person who make reblog
        permlink: `${_.get(json, '[1].author')}/${_.get(json, '[1].permlink')}`,
        reblog_to: {
          author: _.get(json, '[1].author'), // author of source post
          permlink: _.get(json, '[1].permlink'), // permlink of source post
        },
        body: '',
        json_metadata: '',
        ..._.pick(post, ['language', 'wobjects', 'id']),
      });

    if (createPostError) return { error: createPostError };
    const updateData = {
      author: post.author,
      permlink,
      $addToSet: { reblogged_users: account },
    };
    await notificationsUtil.reblog(
      { account: json[1].account, author: post.author, permlink: post.permlink },
    );
    await Post.update(updateData);
    if (createdPost) console.log(`User ${account} reblog post @${json[1].author}/${json[1].permlink}!`);
  }
};
