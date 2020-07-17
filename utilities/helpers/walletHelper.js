const { walletModel } = require('models');
const { WALLET_LENGTH } = require('constants/appData');

exports.addToWallet = async (data) => {
  const { result: wallet } = await walletModel.find({ account: data.account }, { _id: -1 });
  if (wallet.length === WALLET_LENGTH) {
    await walletModel.deleteOne({ _id: wallet[wallet.length - 1]._id });
  }
  await walletModel.create(data);
};
