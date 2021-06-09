const { parentPort } = require('worker_threads');
const updatePostAfterComment = require('utilities/helpers/updatePostAfterComment');
const postHelper = require('utilities/helpers/postHelper');
const { commentParser } = require('parsers');

parentPort.on('message', async (msg) => {
  const data = msg.split(':');
  if (process.env.PARSE_ONLY_VOTES === 'true' || !data[1]) return;
  const [author, permlink] = data[1].split('/');
  switch (data[0]) {
    case 'expire-hivePost':
      await postHelper.updateExpiredPost(author, permlink);
      break;
    case 'expire-notFoundPost':
      await postHelper.createPost({
        author, permlink, fromTTL: true, commentParser,
      });
      break;
    case 'expire-updatePostVotes':
      await postHelper.updatePostVotes(author, permlink);
      break;
    case 'expire-notFoundGuestComment':
      await postHelper.guestCommentFromTTL(author, permlink);
      break;
    case 'expire-hiveComment':
      const [,, isFirst] = data[1].split('/');
      await updatePostAfterComment.updateCounters(author, permlink, isFirst);
      break;
  }
});
