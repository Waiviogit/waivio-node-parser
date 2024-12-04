/* eslint-disable camelcase */
const {
  User, UserExpertise, WObject, Post,
} = require('database').models;
const mongoose = require('mongoose');
const { Wobj, User: UserModel } = require('models');
const postUtil = require('utilities/steemApi/postsUtil');
const moment = require('moment');
const config = require('../../../config');

const parseHbdString = (input) => {
  const numericPart = parseFloat(input.split(' ')[0]);
  return Number.isNaN(numericPart) ? 0 : numericPart;
};

const processUserExpertise = async (user, engineCollection) => {
  const { name } = user;

  await User.updateOne({ name }, { wobjects_weight: 0 });

  const posts = Post.find(
    {
      author: name,
      reblog_to: null,
    },
    {
      root_author: 1,
      author: 1,
      permlink: 1,
      wobjects: 1,
      total_payout_WAIV: 1,
      pending_payout_value: 1,
      total_payout_value: 1,
      last_payout: 1,
    },
  ).lean();

  for await (const dbPost of posts) {
    let authorPayoutHBD = 0;
    let waivUsd = 0;
    const { post } = await postUtil.getPost(dbPost.root_author || name, dbPost.permlink);
    if (dbPost.total_payout_WAIV) {
      const dateString = post?.last_payout || dbPost.last_payout;
      const from = moment(dateString).subtract(1, 'd').format('YYYY-MM-DD');
      const to = moment(dateString).format('YYYY-MM-DD');
      let doc;
      const documents = await engineCollection.find({
        type: 'dailyData',
        base: 'WAIV',
        dateString: { $gte: from, $lte: to },
      }).toArray();

      if (!documents.length) {
        doc = await engineCollection.findOne({
          type: 'dailyData',
          base: 'WAIV',
        }, {}, { $sort: { _id: -1 } });
      } else {
        doc = documents[0];
      }

      if (doc) {
        waivUsd = (dbPost.total_payout_WAIV * doc?.rates?.USD ?? 0) * 0.5;
      }
    }
    if (post) {
      authorPayoutHBD = parseHbdString(post.total_payout_value)
        || (parseHbdString(post.pending_payout_value) * 0.5);
    } else {
      authorPayoutHBD = parseHbdString(dbPost.total_payout_value)
        || (parseHbdString(dbPost.pending_payout_value) * 0.5);
    }
    const weightUsd = authorPayoutHBD + waivUsd;

    for (const wobject of dbPost?.wobjects ?? []) {
      const wobjectWeight = Number((weightUsd * (wobject.percent / 100)).toFixed(3));
      await Wobj.increaseWobjectWeight({
        author_permlink: wobject.author_permlink,
        weight: wobjectWeight * 2, // todo ask X2
      });

      await UserModel.increaseWobjectWeight({
        name,
        author_permlink: wobject.author_permlink,
        weight: wobjectWeight,
      });
    }
  }

  await User.updateOne({ name: user.name }, { processed: true });
};

const rewriteExpertise = async () => {
  const connection = mongoose.createConnection(
    config.mongoConnectionString.replace('waivio', 'Currencies'),
  );
  await connection.asPromise();

  const engineCollection = connection.db.collection('hive-engine-rates');

  while (true) {
    const users = await User.find({ processed: false }, { name: 1 }, { limit: 100 }).lean();
    for (const user of users) {
      await processUserExpertise(user, engineCollection);
    }
    if (!users.length) break;
  }
  await connection.close();
};



module.exports = rewriteExpertise;
