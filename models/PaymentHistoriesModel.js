const { PaymentHistories } = require('database').models;


exports.find = async (condition) => {
  try {
    return { result: await PaymentHistories.find(condition) };
  } catch (error) {
    return { error };
  }
};

exports.findOne = async (condition) => {
  try {
    return { result: await PaymentHistories.findOne(condition) };
  } catch (error) {
    return { error };
  }
};
