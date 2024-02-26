const _ = require('lodash');
const { REQUIRED_POSTING_AUTHS, REQUIRED_AUTHS } = require('../../constants/parsersData');

const getTransactionAccount = (operation) => (
  _.get(operation, REQUIRED_POSTING_AUTHS, _.get(operation, REQUIRED_AUTHS)));

module.exports = {
  getTransactionAccount,
};
