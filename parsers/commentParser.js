const notificationsUtil = require('utilities/notificationsApi/notificationsUtil');
const { checkAppBlacklistValidity } = require('utilities/helpers').appHelper;
const { chosenPostHelper, campaignHelper } = require('utilities/helpers');
const postWithObjectsParser = require('parsers/postWithObjectParser');
const { REDIS_KEY_CHILDREN_UPDATE } = require('constants/common');
const guestCommentParser = require('parsers/guestCommentParser');
const createObjectParser = require('parsers/createObjectParser');
const appendObjectParser = require('parsers/appendObjectParser');
const objectTypeParser = require('parsers/objectTypeParser');
const redisSetter = require('utilities/redis/redisSetter');
const postHelper = require('utilities/helpers/postHelper');
const { chosenPostValidator } = require('validator');
const postModel = require('models/PostModel');
const moment = require('moment');
const _ = require('lodash');

const parse = async (operation, options) => { // data is operation[1] of transaction in block
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
    await postSwitcher({ operation, metadata, options });
  } else if (operation.parent_author && operation.parent_permlink) {
    // comment with parent_author is REPLY TO POST
    await commentSwitcher(({ operation, metadata }));
  }
};

const postSwitcher = async ({
  operation, metadata, post, fromTTL = false, options,
}) => {
  if (_.get(metadata.wobj, 'action') === 'createObjectType') {
    // case if user add wobjects when create post
    await objectTypeParser.parse(operation, metadata); // create new Object Type
  } else {
    await postWithObjectsParser.parse({
      operation, metadata, post, fromTTL, options,
    });
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
  // add wobjects if comment on first level has links in body
  await postHelper.parseCommentBodyWobjects({
    body: operation.body, author: operation.parent_author, permlink: operation.parent_permlink,
  });

  await redisSetter.sadd(
    `${REDIS_KEY_CHILDREN_UPDATE}:${moment.utc().startOf('hour').format()}`,
    `${operation.author}/${operation.permlink}`,
  );

  await postModel.updateOne({
    root_author: operation.parent_author,
    permlink: operation.parent_permlink,
  }, { $inc: { children: 1 } });
};

module.exports = { parse, postSwitcher };
