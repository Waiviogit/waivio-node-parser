const _ = require('lodash');
const { User, Post } = require('models');
const notificationsUtil = require('utilities/notificationsApi/notificationsUtil');


exports.updateAccountParser = async (operation) => {
  if (operation.account && operation.json_metadata) {
    let parsedMetadata;

    try {
      parsedMetadata = JSON.parse(operation.json_metadata);
    } catch (err) {
      console.error(`Not valid metadata on user ${operation.account}`);
    }
    const { result, error } = await User.updateOne(
      { name: operation.account },
      { json_metadata: operation.json_metadata, alias: _.get(parsedMetadata, 'profile.name', null) },
    );

    if (error) {
      console.error(error);
    } else if (result) {
      console.log(`User ${operation.account} update "json_metadata"`);
    }
  }
};

exports.createUser = async (data) => {
  await User.updateOne(
    { name: data.new_account_name }, { json_metadata: data.json_metadata },
  );
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

  if (_.get(json, '[0]') === 'reblog') {
    await this.reblogPostParser({ json, account: _.get(operation, 'required_posting_auths[0]') });
  }
  if (_.get(json, '[0]') === 'follow' && _.get(json, '[1].follower') && _.get(json, '[1].following') && _.get(json, '[1].what')) {
    if (_.get(json, '[1].what[0]') === 'blog') { // if field "what" present - it's follow on user
      const { result } = await User.addUserFollow(json[1]);
      if (result) {
        notificationsUtil.follow(json[1]);
        console.log(`User ${json[1].follower} now following user ${json[1].following}!`);
      }
    } else { // else if missing - unfollow
      const { result } = await User.removeUserFollow(json[1]);
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
        ..._.pick(post, ['language', 'wobjects', 'id']),
      });

    if (createPostError) return { error: createPostError };
    const updateData = {
      author: post.author,
      permlink,
      $addToSet: { reblogged_users: account },
    };
    notificationsUtil.reblog(
      { account: json[1].account, author: post.author, permlink: post.permlink },
    );
    await Post.update(updateData);
    if (createdPost) console.log(`User ${account} reblog post @${json[1].author}/${json[1].permlink}!`);
  }
};
