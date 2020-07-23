const _ = require('lodash');
const { walletModel } = require('models');
const { WALLET_LENGTH } = require('constants/appData');

exports.addToWallet = async (data) => {
  const { result: wallet } = await walletModel.find({
    $or: [{ account: data.account },
      { $and: [{ to: data.account }, { account: { $ne: data.account } }] }],
  }, { _id: -1 });
  if (wallet.length >= WALLET_LENGTH) {
    const extraRecords = wallet.slice(WALLET_LENGTH);
    await walletModel.deleteMany({ _id: { $in: _.map(extraRecords, '_id') } });
  }
  await walletModel.create(data);
};
