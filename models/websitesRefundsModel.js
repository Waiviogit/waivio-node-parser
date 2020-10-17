const { WebsitesRefund } = require('database').models;

exports.create = async (data) => {
  const refund = new WebsitesRefund(data);
  try {
    return { result: !!await refund.save() };
  } catch (error) {
    return { error };
  }
};

exports.find = async (condition) => {
  try {
    return { result: await WebsitesRefund.find(condition).lean() };
  } catch (error) {
    return { error };
  }
};

exports.findOne = async (condition) => {
  try {
    return { result: await WebsitesRefund.findOne(condition).lean() };
  } catch (error) {
    return { error };
  }
};

exports.updateOne = async (condition, updateData) => {
  try {
    return { result: await WebsitesRefund.updateOne(condition, updateData).lean() };
  } catch (error) {
    return { error };
  }
};

exports.deleteOne = async (condition) => {
  try {
    return { result: await WebsitesRefund.deleteOne(condition).lean() };
  } catch (error) {
    return { error };
  }
};

