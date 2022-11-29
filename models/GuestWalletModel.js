const { GuestWallet } = require('database').models;

exports.create = async (data) => {
  const walletRecord = new GuestWallet(data);
  try {
    return { walletRecord: await walletRecord.save() };
  } catch (error) {
    return { error };
  }
};
