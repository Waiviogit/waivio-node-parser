const { CommentModel } = require('models');
const { guestHelpers } = require('utilities/guestOperations');

exports.parse = async ({ operation, metadata }) => {
  const guestInfo = await guestHelpers.getFromMetadataGuestInfo({ operation, metadata });
  if (!guestInfo) return;

  Object.assign(operation, { root_author: 'monterey', root_permlink: 'test-post' });

  const { error } = await CommentModel.createOrUpdate({ ...operation, guestInfo });
  if (error) return console.error(error);
  console.log(`Guest comment created: ${operation.author}/${operation.permlink}, guest name: ${guestInfo.userId}`);
};
