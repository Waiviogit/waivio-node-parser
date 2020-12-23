const _ = require('lodash');
const userValidator = require('validator/userValidator');
const { REQUIRED_POSTING_AUTHS } = require('constants/parsersData');

const validateRatingVote = async (data, operation) => {
  if (!await userValidator.validateUserOnBlacklist(_.get(operation, REQUIRED_POSTING_AUTHS))) return false;
  const requiredFieldsRatingVote = 'author,permlink,author_permlink,rate'.split(',');

  for (let i = 0; i < requiredFieldsRatingVote.length; i++) {
    if (_.isNil(data[requiredFieldsRatingVote[i]])) {
      return false;
    }
  }

  return _.get(data, 'rate') <= 10 && _.get(data, 'rate') >= 0;
};

const validateObjectType = async (data) => {
  const requiredFieldsObjectType = 'author,permlink,name'.split(',');
  for (let i = 0; i < requiredFieldsObjectType.length; i++) {
    if (_.isNil(data[requiredFieldsObjectType[i]])) {
      return false;
    }
  }
  return userValidator.validateUserOnBlacklist(_.get(data, 'author'));
};

module.exports = {
  validateRatingVote, validateObjectType,
};
