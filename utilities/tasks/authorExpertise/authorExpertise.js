/* eslint-disable camelcase */
const { User, Post } = require('database').models;
const mongoose = require('mongoose');
const { Wobj, User: UserModel } = require('models');
const moment = require('moment');
const _ = require('lodash');
const config = require('../../../config');

const POSTS_COUNT = 12000000;
let postProcessed = 0;

const startTime = Date.now();

const estimateTimeLeft = () => {
  const now = Date.now();
  const elapsedTime = (now - startTime) / 1000;

  if (elapsedTime <= 0 || postProcessed === 0) {
    return 'Calculating...';
  }

  const averageRate = postProcessed / elapsedTime;
  const postsLeft = POSTS_COUNT - postProcessed;
  const timeLeft = postsLeft / averageRate;

  // Format time left into hours, minutes, and seconds
  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = Math.floor(timeLeft % 60);

  return `${hours}h ${minutes}m ${seconds}s`;
};

const parsePayoutAmount = (amount) => parseFloat(String(amount).replace(/\s[A-Z]*$/, '')) || 0;

const isPostCashout = (post) => Date.parse(_.get(post, 'cashout_time')) < Date.now();
const calculatePayout = (post, rates) => {
  if (!post) return {};
  const payoutDetails = {};
  const waivPayout = isPostCashout(post)
    ? _.get(post, 'total_rewards_WAIV', 0) * rates
    : _.get(post, 'total_payout_WAIV', 0) * rates;

  const max_payout = parsePayoutAmount(post.max_accepted_payout);
  const pending_payout = parsePayoutAmount(post.pending_payout_value);
  const total_author_payout = parsePayoutAmount(post.total_payout_value);
  const total_curator_payout = parsePayoutAmount(post.curator_payout_value);
  let payout = pending_payout + total_author_payout + total_curator_payout + waivPayout;
  const hivePayout = total_author_payout + total_curator_payout + pending_payout;
  const hbdPercent = post.percent_hbd ? 0.25 : 0;

  if (payout < 0) payout = 0.0;
  if (payout > max_payout) payout = max_payout;

  payoutDetails.payoutLimitHit = payout >= max_payout;
  payoutDetails.totalPayout = payout;
  payoutDetails.potentialPayout = pending_payout + waivPayout;
  payoutDetails.HBDPayout = hivePayout * hbdPercent;
  payoutDetails.WAIVPayout = waivPayout;
  payoutDetails.HIVEPayout = hivePayout - payoutDetails.HBDPayout;

  return payoutDetails;
};

const isDateGreaterThan25Hardfork = (dateString) => {
  const inputDate = moment(dateString);
  const comparisonDate = moment('2021-06-30');
  return inputDate.isAfter(comparisonDate);
};

const processUserExpertise = async (user, engineCollection) => {
  const { name } = user;

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
      total_rewards_WAIV: 1,
      pending_payout_value: 1,
      curator_payout_value: 1,
      total_payout_value: 1,
      last_payout: 1,
      max_accepted_payout: 1,
      cashout_time: 1,
    },
  ).lean();

  for await (const dbPost of posts) {
    const postTimestamp = dbPost._id.getTimestamp();
    if (moment(postTimestamp).isAfter(moment(startTime))) continue;

    let rates = 0;
    if (dbPost.total_payout_WAIV || dbPost.total_rewards_WAIV) {
      const dateString = dbPost.last_payout;
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

      if (doc) rates = doc?.rates?.USD || 0;
    }

    const payoutDetails = calculatePayout(dbPost, rates);

    const weightUsd = isDateGreaterThan25Hardfork(dbPost.last_payout)
      ? payoutDetails.totalPayout * 0.5
      : payoutDetails.totalPayout * 0.75;

    for (const wobject of dbPost?.wobjects ?? []) {
      const wobjectWeight = Number((weightUsd * (wobject.percent / 100)).toFixed(8));

      if (wobjectWeight === 0) continue;

      await Wobj.increaseWobjectWeight({
        author_permlink: wobject.author_permlink,
        weight: wobjectWeight,
      });

      await UserModel.increaseWobjectWeight({
        name,
        author_permlink: wobject.author_permlink,
        weight: wobjectWeight,
      });
    }
    postProcessed++;
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
      console.log(user.name, `processed  total posts :${postProcessed}`);
      console.log('estimateTimeLeft: ', estimateTimeLeft());
    }
    if (!users.length) break;
  }
  await connection.close();
};

module.exports = rewriteExpertise;
