const { CommentModel } = require('models');
const { postsUtil } = require('utilities/steemApi');
const { guestHelpers } = require('utilities/guestOperations');
const { setExpiredPostTTL } = require('utilities/redis/redisSetter');
const _ = require('lodash');

exports.parse = async ({ operation, metadata }) => {
  const guestInfo = await guestHelpers.getFromMetadataGuestInfo({ operation, metadata });
  if (!guestInfo) return;

  const { post: comment, err } = await postsUtil
    .getPost(operation.parent_author, operation.parent_permlink);
  if (err || !comment) {
    await setExpiredPostTTL('notFoundGuestComment', `${operation.author}/${operation.permlink}`, 120);
  }
  const { error } = await CommentModel.createOrUpdate({
    author: operation.author,
    permlink: operation.permlink,
    parent_author: operation.parent_author,
    parent_permlink: operation.parent_permlink,
    root_author: _.get(comment, 'root_author', ''),
    root_permlink: _.get(comment, 'root_permlink', ''),
    guestInfo,
  });
  if (error) return console.error(error.message);
  console.log(`Guest comment created: ${operation.author}/${operation.permlink}, guest name: ${guestInfo.userId}`);
};
