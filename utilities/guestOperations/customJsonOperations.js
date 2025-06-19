const _ = require('lodash');
const { getFromMetadataGuestInfo } = require('utilities/guestOperations/guestHelpers');
const notificationsUtil = require('utilities/notificationsApi/notificationsUtil');
const { votePostHelper } = require('utilities/helpers');
const postWithObjectParser = require('parsers/postWithObjectParser');
const followObjectParser = require('parsers/followObjectParser');
const jsonHelper = require('utilities/helpers/jsonHelper');
const { postsUtil } = require('utilities/steemApi');
const userParsers = require('parsers/userParsers');
const { Post, CommentModel } = require('models');
const voteParser = require('parsers/voteParser');
const { verifySignature } = require('utilities/helpers/signatureHelper');
const { VERIFY_SIGNATURE_TYPE } = require('constants/parsersData');
const { voteOnObjectFields } = require('../../parsers/voteParser');

exports.followUser = async (operation) => {
  const validSignature = await verifySignature({
    operation, type: VERIFY_SIGNATURE_TYPE.CUSTOM_JSON,
  });
  if (!validSignature) return;

  const json = jsonHelper.parseJson(operation.json);
  if (!json || _.isEmpty(json)) return;

  operation.required_posting_auths = [_.get(json, '[1].follower')];
  await userParsers.followUserParser(operation);
};

exports.reblogPost = async (operation) => {
  const validSignature = await verifySignature({
    operation, type: VERIFY_SIGNATURE_TYPE.CUSTOM_JSON,
  });
  if (!validSignature) return;

  const json = jsonHelper.parseJson(operation.json);
  if (!json || _.isEmpty(json)) return;

  operation.required_posting_auths = [_.get(json, '[1].account')];
  await userParsers.followUserParser(operation);
};

exports.followWobject = async (operation) => {
  const validSignature = await verifySignature({
    operation, type: VERIFY_SIGNATURE_TYPE.CUSTOM_JSON,
  });
  if (!validSignature) return;

  const json = jsonHelper.parseJson(operation.json);
  if (!json || _.isEmpty(json)) return;

  operation.required_posting_auths = [_.get(json, '[1].user')];
  await followObjectParser.parse(operation);
};

exports.guestVote = async (operation) => {
  const validSignature = await verifySignature({
    operation, type: VERIFY_SIGNATURE_TYPE.CUSTOM_JSON,
  });
  if (!validSignature) return;

  const json = jsonHelper.parseJson(operation.json);
  if (!json || _.isEmpty(json)) return;

  const { votesOps: [vote] } = await voteParser.votesFormat([json]);
  if (vote.type === 'post_with_wobj' || !vote.type) {
    await voteOnPost({ vote });
  } else if (vote.type === 'append_wobj') {
    await guestVoteOnField({ vote });
  }
};

exports.accountUpdate = async (operation) => {
  const validSignature = await verifySignature({
    operation, type: VERIFY_SIGNATURE_TYPE.CUSTOM_JSON,
  });
  if (!validSignature) return;

  const json = jsonHelper.parseJson(operation.json);
  if (!json || _.isEmpty(json)) return;
  await userParsers.updateAccountParser(json);
};

exports.subscribeNotification = async (operation) => {
  const validSignature = await verifySignature({
    operation, type: VERIFY_SIGNATURE_TYPE.CUSTOM_JSON,
  });
  if (!validSignature) return;

  const json = jsonHelper.parseJson(operation.json);
  if (!json || _.isEmpty(json)) return;

  operation.required_posting_auths = [_.get(json, '[1].follower')];
  await userParsers.subscribeNotificationsParser(operation);
};

// /////////////// //
// Private methods //
// /////////////// //
/**
 * Vote on post/comment(not on "wobject field").
 * Find post in DB and call voteOnPost helper.
 * If post in db not found --> call "findOrCreatePost",
 * which find post/comment, create in DB and return.
 * If post actually is 'comment', just call 'CommentModel.addVote'
 * @param vote
 * @returns {Promise<{error: *}|{result: *}|undefined>}
 */
const voteOnPost = async ({ vote }) => {
  const { post: existPost, error } = await Post.findOne({
    root_author: vote.author, permlink: vote.permlink,
  });
  if (error) return;

  let post,
    comment;
  if (!existPost) {
    const { err, post: dbPost, comment: dbComment } = await findOrCreatePost(_.pick(vote, ['author', 'permlink']));
    if (err) {
      console.error(`Failed on vote from guest user: ${vote.voter}!`);
      return { err };
    }
    if (dbPost) post = dbPost.toObject();
    else if (dbComment) comment = dbComment;
  } else {
    post = existPost;
  }
  if (post) {
    _.remove(post.active_votes, (v) => v.voter === vote.voter);
    post.active_votes.push({ voter: vote.voter, percent: vote.weight, rshares: 1 });

    let metadata;
    if (post.json_metadata) {
      metadata = jsonHelper.parseJson(post.json_metadata);
      if (!_.get(metadata, 'wobj')) metadata.wobj = { wobjects: vote.wobjects };
    }
    if (vote.weight > 0) await notificationsUtil.custom({ id: 'like', likes: [{ ...vote, weight: 0 }] });
    return votePostHelper.voteOnPost({
      post,
      metadata,
      percent: vote.weight,
      ..._.pick(vote, ['wobjects', 'author', 'permlink', 'voter']),
    });
  } if (comment) {
    // add to existing comment one new vote
    vote.percent = vote.weight;
    const { result, error: addVoteError } = await CommentModel.addVote({ ..._.pick(vote, ['author', 'permlink', 'voter', 'percent']) });
    if (addVoteError) {
      console.error(addVoteError);
      return { error: addVoteError };
    }
    if (result.ok) console.log(`Guest user ${vote.voter} vote for comment @${vote.author}/${vote.permlink}`);
    return { result };
  }
};

const guestVoteOnField = async ({ vote }) => {
  await voteOnObjectFields([{
    author: vote.author,
    permlink: vote.permlink,
    voter: vote.voter,
    root_wobj: vote.root_wobj,
    weight: vote.weight,
    type: vote.type,
  }]);
};

/**
 * Save post/comment in DB if it wasn't exist before and return
 * @param data {Object} author, permlink
 * @returns {Promise<{err: *}|{newPost: ({post: *}|{error: *})}|{err: string}|{newComment: *}>}
 */
const findOrCreatePost = async ({ author, permlink }) => {
  const { post, err } = await postsUtil.getPost(author, permlink);
  if (err) return { err };
  if (!post || !post.author) {
    const errorMessage = `[findOrCreatePost] Trying vote on not existing post in hive: @${author}/${permlink}`;
    console.error(errorMessage);
    return { err: errorMessage };
  }
  // if comment not empty and without parent_author -> it's POST
  if (post.parent_author === '') {
    const { post: dbPost, error: findPostError } = await Post.findOne({
      root_author: author, permlink,
    });
    if (findPostError) console.error(findPostError);
    if (dbPost) return { post: dbPost };

    const { post: newPost, error: parsePostError } = await postWithObjectParser
      .parse({
        operation: _.pick(post, ['author', 'permlink', 'body', 'json_metadata', 'title', 'parent_permlink', 'parent_author']),
        metadata: jsonHelper.parseJson(post.json_metadata),
      });

    if (parsePostError) return { err: parsePostError };
    return { post: newPost };
  }
  // else, it's -> COMMENT
  const { comment: dbComment, error: findCommentError } = await CommentModel.getOne({
    author, permlink,
  });
  if (findCommentError) console.error(findCommentError);
  if (dbComment) return { comment: dbComment };

  const comment = { ...post };
  comment.active_votes = [];
  comment.guestInfo = await getFromMetadataGuestInfo({
    operation: comment, metadata: jsonHelper.parseJson(comment.json_metadata),
  });

  const { comment: newComment, error } = await CommentModel.createOrUpdate(comment);
  if (error) return { err: error };
  return { comment: newComment };
};
