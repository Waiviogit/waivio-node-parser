const co = require('co');
const _ = require('lodash');
const moment = require('moment');
const { Post } = require('database').models;
const postHelper = require('utilities/helpers/postHelper');

const updatePayouts = async () => {
  const sevenDaysAgo = moment().subtract(7, 'd').toISOString();

  await co(function *iterateCursor() {
    const cursor = Post
      .find({ createdAt: { $lte: new Date(sevenDaysAgo) } }).lean().cursor();
    for (let doc = yield cursor.next(); doc != null; doc = yield cursor.next()) {
      const author = _.get(doc, 'author', 0);
      const permlink = _.get(doc, 'permlink', 0);
      const cashoutTime = _.get(doc, 'cashout_time', 0);
      const totalPayoutValue = _.get(doc, 'total_payout_value', 0);
      const pendingPayoutValue = _.get(doc, 'pending_payout_value', 0);
      const curatorPayoutValue = _.get(doc, 'curator_payout_value', 0);
      console.log(`Now updating post ${author}/${permlink}`);
      const expiredCashOut = new Date(cashoutTime).valueOf() + 1800000 < new Date().valueOf()
          && parseFloat(pendingPayoutValue) > 0;
      const zeroValues = parseFloat(totalPayoutValue) === 0 && parseFloat(curatorPayoutValue) === 0;

      if (expiredCashOut && zeroValues) {
        yield postHelper.updateExpiredPost(author, permlink);
      }
    }
    console.log('task update payouts done!');
  });
};

module.exports = { updatePayouts };
