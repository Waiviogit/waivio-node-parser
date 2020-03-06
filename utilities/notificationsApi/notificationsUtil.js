const _ = require('lodash');
const axios = require('axios');
const { redisGetter } = require('utilities/redis');
const { findOne } = require('models/PostModel');
const { HOST, BASE_URL, SET_NOTIFICATION } = require('constants/appData').notificationsApi;

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

const reply = async ({ operation, metadata }) => {
  if (_.get(metadata, 'comment.userId')) {
    operation.author = metadata.comment.userId;
  }
  const { post } = await findOne(
    { root_author: operation.parent_author, permlink: operation.parent_permlink },
  );
  if (!post) return;
  operation.parent_author = post.author;
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

const transfer = async (data) => {
  const operation = {
    id: 'transfer',
    data,
  };
  await sendNotification(operation);
};

const witness = async (data) => {
  const operation = {
    id: 'account_witness_vote',
    data,
  };
  await sendNotification(operation);
};

module.exports = {
  reblog, follow, reply, transfer, witness, post,
};
