const { WObject } = require('database').models;
const _ = require('lodash');
const moment = require('moment');
const { postsUtil } = require('utilities/steemApi');

let countVotes = 0;

module.exports = async () => {
  try {
    const dateFrom = moment('2022-12-19T00:00:20.381+00:00').toDate();
    const objects = await WObject.find({ createdAt: { $gte: dateFrom } }).lean();
    for (const object of objects) {
      for (const field of object.fields) {
        if (_.isEmpty(field.active_votes)) continue;
        for (const vote of field.active_votes) {
          if (!vote) continue;
          if (vote.percent !== 0) continue;
          const { post, err } = await postsUtil.getPost(field.author, field.permlink);
          if (err) {
            console.error(err.message);
            continue;
          }
          const realVote = _.find(post.active_votes, (v) => v.voter === vote.voter);
          if (!realVote) continue;
          if (realVote.percent === vote.percent) continue;
          countVotes++;
          await WObject.updateOne(
            {
              'fields.active_votes._id': vote._id,
            },
            {
              $set: { 'fields.$[f].active_votes.$[v].percent': realVote.percent },
            },
            {
              arrayFilters: [
                { 'f._id': field._id },
                { 'v._id': vote._id },
              ],
            },
          );
          console.log(countVotes);
        }
      }
    }
    console.log('countVotes', countVotes);
  } catch (error) {
    console.error(error.message);
  }
};
