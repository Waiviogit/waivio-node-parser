const _ = require('lodash');
const axios = require('axios');
const { redisGetter } = require('utilities/redis');
const {
  Post, Wobj, UserWobjects, CommentModel,
} = require('models');
const {
  HOST, BASE_URL, SET_NOTIFICATION, WS_SET_NOTIFICATION,
} = require('constants/appData').notificationsApi;
const { postsUtil } = require('utilities/steemApi');
const { socketClient } = require('utilities/socketClient/socketClient');
const { FIELDS_NAMES } = require('constants/wobjectsData');

const URL = HOST + BASE_URL + SET_NOTIFICATION;

const NOTIFICATION_ID = {
  OBJECT_UPDATES: 'objectUpdates',
  OBJECT_UPDATES_REJECT: 'objectUpdatesReject',
  GROUP_ID_UPDATES: 'groupIdUpdates',
  GROUP_ID_UPDATES_REJECT: 'groupIdUpdatesReject',
  RESTAURANT_STATUS: 'restaurantStatus',
  COMMENT: 'comment',
  CUSTOM_JSON: 'custom_json',
  REBLOG: 'reblog',
  FOLLOW: 'follow',
  REJECT_UPDATE: 'rejectUpdate',
};

const sendNotification = async (operation) => {
  const reqData = {
    id: operation.id,
    block: await redisGetter.getLastBlockNum(),
    data: operation.data,
  };
  sendSocketNotification(reqData);
};

const sendSocketNotification = (operation) => {
  const message = JSON.stringify({ method: WS_SET_NOTIFICATION, payload: operation });
  socketClient.sendMessage(message);
};

const request = async (reqData) => {
  const { API_KEY } = process.env;
  try {
    await axios.post(URL, reqData, { headers: { API_KEY } });
  } catch (error) {
    console.log(error.message);
  }
};

const reblog = async ({
  account, author, permlink, title,
}) => {
  const operation = {
    id: NOTIFICATION_ID.CUSTOM_JSON,
    data: {
      id: NOTIFICATION_ID.REBLOG,
      json: {
        account, author, permlink, title,
      },
    },
  };
  await sendNotification(operation);
};

const follow = async ({ follower, following }) => {
  const operation = {
    id: NOTIFICATION_ID.CUSTOM_JSON,
    data: {
      id: NOTIFICATION_ID.FOLLOW,
      json: { follower, following },
    },
  };
  await sendNotification(operation);
};

const reply = async (operation, metadata) => {
  let replyFlag = false;
  if (_.get(metadata, 'comment.userId')) {
    operation.author = metadata.comment.userId;
  }
  let { post } = await Post.findOne(
    { root_author: operation.parent_author, permlink: operation.parent_permlink },
  );
  if (!post) { // if parent post - comment, find it at guest comments
    const { comment } = await CommentModel.getOne(
      { author: operation.parent_author, permlink: operation.parent_permlink },
    );
    if (comment) {
      post = {
        author: _.get(comment, 'guestInfo.userId'),
      };
      replyFlag = true;
    } else {
      const { post: hivePost } = await postsUtil.getPost(operation.parent_author, operation.parent_permlink);
      if (hivePost && hivePost.depth >= 1) replyFlag = true;
    }
  }
  operation.parent_author = _.get(post, 'author', operation.parent_author);
  operation.reply = replyFlag;
  const op = {
    id: NOTIFICATION_ID.COMMENT,
    data: operation,
  };
  await sendNotification(op);
};

const post = async (data) => {
  data.author = _.get(data, 'guestInfo.userId', data.author);
  const operation = {
    id: NOTIFICATION_ID.COMMENT,
    data,
  };
  await sendNotification(operation);
};

const custom = async (data) => {
  const operation = {
    id: data.id,
    data,
  };
  await sendNotification(operation);
};

const restaurantStatus = async (data, permlink, status = undefined) => {
  const { wobject } = await Wobj.getOne({ author_permlink: permlink });
  const wobjStatus = _.get(wobject, 'status.title');
  if ((wobjStatus === status) || (!wobjStatus && !status)) return;

  const { result } = await UserWobjects.find({ author_permlink: permlink, weight: { $gt: 0 } });
  if (!result || !result.length) return;
  data.object_name = getNameFromFields(wobject.fields);
  data.experts = _.map(result, (expert) => expert.user_name);
  data.oldStatus = wobjStatus || '';
  data.newStatus = status || '';
  data.author_permlink = permlink;
  await sendNotification({
    id: NOTIFICATION_ID.RESTAURANT_STATUS,
    data,
  });
};

const rejectUpdate = async (data) => {
  const { wobject } = await Wobj.getOne({ author_permlink: data.author_permlink });
  if (!wobject) return;
  if (wobject.parent) {
    const { wobject: parentWobj } = await Wobj.getOne({ author_permlink: wobject.parent });
    if (parentWobj) {
      data.parent_permlink = wobject.parent;
      data.parent_name = getNameFromFields(parentWobj.fields);
    }
  }
  data.object_name = getNameFromFields(wobject.fields);
  await sendNotification({
    id: NOTIFICATION_ID.REJECT_UPDATE,
    data,
  });
};

const getNameFromFields = (fields) => {
  const result = _.chain(fields)
    .filter((field) => field.name === 'name')
    .sortBy('weight')
    .first()
    .value();
  return _.get(result, 'body');
};

const fieldUpdateNotification = async ({
  authorPermlink, field, reject, initiator,
}) => {
  const { wobject } = await Wobj.findOne({
    filter: { author_permlink: authorPermlink },
  });
  if (!wobject) return;
  const objectName = getNameFromFields(wobject.fields);

  const sendTo = _.uniq([
    ...(wobject?.authority?.ownership ?? []),
    ...(wobject?.authority?.administrative ?? []),
  ].filter((el) => el !== field?.creator));

  if (field.name === FIELDS_NAMES.GROUP_ID) {
    const { result } = await Wobj.find(
      {
        metaGroupId: wobject.metaGroupId,
      },
      {
        authority: 1,
      },
    );

    const receivers = _.uniq(_.flatten(result
      .map((el) => [...el?.authority?.administrative ?? [], ...el?.authority?.ownership ?? []])))
      .filter((el) => el !== field?.creator && !sendTo.includes(el));

    if (receivers.length) {
      await sendNotification({
        id: reject
          ? NOTIFICATION_ID.GROUP_ID_UPDATES_REJECT
          : NOTIFICATION_ID.GROUP_ID_UPDATES,
        data: {
          receivers,
          objectName,
          authorPermlink,
          initiator,
        },
      });
    }
  }
  console.log('UPDATE NOTIFICATION');
  console.log(sendTo);
  if (!sendTo.length) return;

  await sendNotification({
    id: reject
      ? NOTIFICATION_ID.OBJECT_UPDATES_REJECT
      : NOTIFICATION_ID.OBJECT_UPDATES,
    data: {
      fieldName: field.name,
      receivers: sendTo,
      objectName,
      authorPermlink,
      initiator,
    },
  });
};

module.exports = {
  reblog,
  follow,
  reply,
  custom,
  post,
  restaurantStatus,
  rejectUpdate,
  sendNotification,
  fieldUpdateNotification,
};
