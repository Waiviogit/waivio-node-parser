const _ = require('lodash');
const createObjectParser = require('parsers/createObjectParser');
const appendObjectParser = require('parsers/appendObjectParser');
const objectTypeParser = require('parsers/objectTypeParser');
const postWithObjectsParser = require('parsers/postWithObjectParser');
const guestCommentParser = require('parsers/guestCommentParser');
const { chosenPostHelper, campaignHelper } = require('utilities/helpers');
const { checkAppBlacklistValidity } = require('utilities/helpers').appHelper;
const updatePostAfterComment = require('utilities/helpers/updatePostAfterComment');
const { chosenPostValidator } = require('validator');
const notificationsUtil = require('utilities/notificationsApi/notificationsUtil');

const parse = async (operation) => { // data is operation[1] of transaction in block
  let metadata;

  try {
    if (operation.json_metadata !== '') {
      metadata = JSON.parse(operation.json_metadata); // parse json_metadata from string to JSON
    }
  } catch (e) {
    console.error(e);
  }

  if (!(await checkAppBlacklistValidity(metadata))) return;

  if (operation.parent_author === '' && metadata) {
    // comment without parent_author is POST
    await postSwitcher({ operation, metadata });
  } else if (operation.parent_author && operation.parent_permlink) {
    // comment with parent_author is REPLY TO POST
    await commentSwitcher(({ operation, metadata }));
  }
};

const postSwitcher = async ({
  operation, metadata, post, fromTTL = false,
}) => {
  if (_.get(metadata.wobj, 'action') === 'createObjectType') {
    // case if user add wobjects when create post
    await objectTypeParser.parse(operation, metadata); // create new Object Type
  } else {
    await postWithObjectsParser.parse(operation, metadata, post, fromTTL);
  }
};

const commentSwitcher = async ({ operation, metadata }) => {
  if (_.get(metadata, 'comment.userId')) {
    await guestCommentParser.parse({ operation, metadata });
  }
  const sendNotification = await campaignHelper
    .parseReservationConversation(_.cloneDeep(operation), metadata);

  if (sendNotification) await notificationsUtil.reply({ ...operation }, metadata);

  if (_.get(metadata, 'wobj.action')) {
    switch (metadata.wobj.action) {
      case 'createObject':
        await createObjectParser.parse(operation, metadata);
        break;
      case 'appendObject':
        await appendObjectParser.parse(operation, metadata);
        break;
    }
  }

  // look out comment for select chosen one post by specified app
  if (chosenPostValidator.checkBody(operation.body)) {
    await chosenPostHelper.updateAppChosenPost(operation);
  }
  await updatePostAfterComment.updateCounters(operation.author, operation.permlink, operation.parent_author, operation.parent_permlink);
};

module.exports = { parse, postSwitcher };
