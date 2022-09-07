const { CampaignV2 } = require('database').models;
const _ = require('lodash');
const mongoose = require('mongoose');

const { Schema } = mongoose;

const CampaignPayment = new Schema({
  payoutTokenRateUSD: { type: Number },
  reservationPermlink: { type: String },
});

const CampaignPaymentModel = mongoose
  .model('campaign_payments', CampaignPayment, 'campaign_payments');

const runTask = async () => {
  try {
    const users = await CampaignV2.aggregate([
      {
        $unwind: {
          path: '$users',
        },
      },
      {
        $match: {
          'users.status': 'completed',
        },
      },
      { $replaceRoot: { newRoot: '$users' } },
    ]);
    if (_.isEmpty(users)) return;
    for (const user of users) {
      await CampaignPaymentModel.updateMany(
        { reservationPermlink: user.reservationPermlink },
        { payoutTokenRateUSD: user.payoutTokenRateUSD },
      );
    }
  } catch (e) {
    console.error(e.message);
  }
};

(async () => {
  await runTask();
  process.exit();
})();
