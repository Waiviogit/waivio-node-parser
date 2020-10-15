const { CommentModel } = require('models');
const { guestHelpers } = require('utilities/guestOperations');
const { postsUtil } = require('utilities/steemApi');

exports.parse = async ({ operation, metadata }) => {
  const guestInfo = await guestHelpers.getFromMetadataGuestInfo({ operation, metadata });
  if (!guestInfo) return;

  let { post: comment, err } = await postsUtil.getPost(operation.author, operation.permlink);
  if (err || !comment) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    ({ post: comment, err } = await postsUtil.getPost(operation.author, operation.permlink));

    if (err) return console.error(err || `Comment @${operation.author}/${operation.permlink} not found!`);
  }

  delete comment.active_votes;
  const { error } = await CommentModel.createOrUpdate({ ...comment, guestInfo });
  if (error) return console.error(error);
  console.log(`Guest comment created: ${operation.author}/${operation.permlink}, guest name: ${guestInfo.userId}`);
};
