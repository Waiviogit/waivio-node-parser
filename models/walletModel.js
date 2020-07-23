const { Wallet } = require('database').models;


exports.create = async (data) => {
  const walletData = new Wallet(data);
  try {
    return { wallet: await walletData.save() };
  } catch (error) {
    return { error };
  }
};

exports.find = async (condition, sort = {}) => {
  try {
    return { result: await Wallet.find(condition).sort(sort) };
  } catch (error) {
    return { error };
  }
};

exports.deleteOne = async (condition) => {
  try {
    return { result: await Wallet.deleteOne(condition) };
  } catch (error) {
    return { error };
  }
};

exports.deleteMany = async (condition) => {
  try {
    return { result: await Wallet.deleteMany(condition) };
  } catch (error) {
    return { error };
  }
};
