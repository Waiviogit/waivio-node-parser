const notificationsUtil = require('utilities/notificationsApi/notificationsUtil');
const { walletHelper } = require('utilities/helpers');

const parse = async (operation, trxId) => {
  await notificationsUtil.custom(Object.assign(operation, { id: 'claimReward' }));
  const data = {
    type: 'claim_reward_balance',
    account: operation.account,
    reward_steem: operation.reward_steem,
    reward_sbd: operation.reward_sbd,
    reward_vests: operation.reward_vests,
    trx_id: trxId,
    timestamp: Math.round(new Date() / 1000),
  };
  await walletHelper.addToWallet(data);
};

module.exports = { parse };
