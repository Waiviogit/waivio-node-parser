const _ = require('lodash');
const axios = require('axios');
const { redisGetter } = require('utilities/redis');
const {
  Post, Wobj, UserWobjects, CommentModel,
} = require('models');
const {
  HOST, BASE_URL, SET_NOTIFICATION, STATUS,
} = require('constants/appData').notificationsApi;
const { postsUtil } = require('utilities/steemApi');

const URL = HOST + BASE_URL + SET_NOTIFICATION;

const sendNotification = async (operation) => {
  const reqData = {
    id: operation.id,
    block: await redisGetter.getLastBlockNum(),
    data: operation.data,
  };
  request(reqData);
};


const request = async (reqData) => {
  const { API_KEY } = process.env;
  try {
    await axios.post(URL, reqData, { headers: { API_KEY } });
  } catch (error) {
    console.log(error.message);
  }
};

const reblog = async ({ account, author, permlink }) => {
  const operation = {
    id: 'custom_json',
    data: {
      id: 'reblog',
      json: { account, author, permlink },
    },
  };
  await sendNotification(operation);
};

const follow = async ({ follower, following }) => {
  const operation = {
    id: 'custom_json',
    data: {
      id: 'follow',
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
      const { post: hivePost } = await postsUtil.getPost(
        operation.parent_author, operation.parent_permlink,
      );
      if (hivePost && hivePost.depth >= 2) replyFlag = true;
    }
  }
  operation.parent_author = _.get(post, 'author', operation.parent_author);
  operation.reply = replyFlag;
  const op = {
    id: 'comment',
    data: operation,
  };
  await sendNotification(op);
};

const post = async (data, postData) => {
  postData.author = _.get(data, 'guestInfo.userId', data.author);
  const operation = {
    id: 'comment',
    data: postData,
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

const restaurantStatus = async (data, permlink) => {
  const { wobject } = await Wobj.getOne({ author_permlink: permlink });
  const statusTitle = _.get(wobject, 'status.title', null);
  if (!wobject || (_.includes(STATUS, statusTitle) && !data.voter)) return;
  const { result } = await UserWobjects.find({ author_permlink: permlink, weight: { $gt: 0 } });
  if (!result || !result.length) return;
  data.object_name = _
    .chain(wobject.fields)
    .filter((field) => field.name === 'name')
    .sortBy('weight')
    .first()
    .value().body;
  data.experts = _.map(result, (expert) => expert.user_name);
  data.author_permlink = permlink;
  await sendNotification({
    id: 'restaurantStatus',
    data,
  });
};

module.exports = {
  reblog, follow, reply, custom, post, restaurantStatus,
};
