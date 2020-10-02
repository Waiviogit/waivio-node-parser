const { WebsitePayments } = require('database').models;

exports.create = async (data) => {
  const payment = new WebsitePayments(data);
  try {
    return { result: !!await payment.save() };
  } catch (error) {
    return { error };
  }
};

exports.find = async ({ condition, sort }) => {
  try {
    return { result: await WebsitePayments.find(condition).sort(sort).lean() };
  } catch (error) {
    return { error };
  }
};

exports.aggregate = async (condition) => {
  try {
    return { result: await WebsitePayments.aggregate(condition).lean() };
  } catch (error) {
    return { error };
  }
};

exports.findOne = async (condition) => {
  try {
    return { result: await WebsitePayments.findOne(condition).lean() };
  } catch (error) {
    return { error };
  }
};
