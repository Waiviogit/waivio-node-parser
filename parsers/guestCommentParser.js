const { CommentModel, Post } = require('models');
const { guestHelpers } = require('utilities/guestOperations');
const { postsUtil } = require('utilities/steemApi');

exports.parse = async ({ operation, metadata }) => {
  const guestInfo = await guestHelpers.getFromMetadataGuestInfo({ operation, metadata });
  if (!guestInfo) return;

  const { post: comment, err } = await postsUtil.getPost(operation.author, operation.permlink);
  if (err || !comment) {
    return console.error(err || `Comment @${operation.author}/${operation.permlink} not found!`);
  }

  delete comment.active_votes;
  const { error } = await CommentModel.createOrUpdate({ ...comment, guestInfo });
  if (error) return console.error(error);
  await Post.update(
    { author: comment.root_author, permlink: comment.root_permlink, $inc: { children: 1 } },
  );
  console.log(`Guest comment created: ${operation.author}/${operation.permlink}, guest name: ${guestInfo.userId}`);
};
