const { CommentModel } = require('models');
const { postsUtil } = require('utilities/steemApi');
const { guestHelpers } = require('utilities/guestOperations');
const { setExpiredPostTTL } = require('utilities/redis/redisSetter');

exports.parse = async ({ operation, metadata }) => {
  const guestInfo = await guestHelpers.getFromMetadataGuestInfo({ operation, metadata });
  if (!guestInfo) return;

  const { post: comment, err } = await postsUtil
    .getPost(operation.parent_author, operation.parent_permlink);
  if (err || !comment) {
    return setExpiredPostTTL('notFoundGuestComment', `${operation.author}/${operation.permlink}`, 30);
  }
  const { error } = await CommentModel.createOrUpdate({
    author: operation.author,
    permlink: operation.permlink,
    parent_author: comment.author,
    parent_permlink: comment.permlink,
    root_author: comment.parent_author,
    root_permlink: comment.parent_permlink,
    guestInfo,
  });
  if (error) return console.error(error.message);
  console.log(`Guest comment created: ${operation.author}/${operation.permlink}, guest name: ${guestInfo.userId}`);
};
