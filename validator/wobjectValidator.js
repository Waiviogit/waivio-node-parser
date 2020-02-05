const _ = require('lodash');
const { validateUserOnBlacklist } = require('validator/userValidator');

const validateRatingVote = (data, operation) => {
  if (!validateUserOnBlacklist(_.get(operation, 'required_posting_auths[0]'))) return false;
  const requiredFieldsRatingVote = 'author,permlink,author_permlink,rate'.split(',');

  for (let i = 0; i < requiredFieldsRatingVote.length; i++) {
    if (_.isNil(data[requiredFieldsRatingVote[i]])) {
      return false;
    }
  }

  return _.get(data, 'rate') <= 10 && _.get(data, 'rate') >= 0;
};

const validateObjectType = (data) => {
  const requiredFieldsObjectType = 'author,permlink,name'.split(',');
  for (let i = 0; i < requiredFieldsObjectType.length; i++) {
    if (_.isNil(data[requiredFieldsObjectType[i]])) {
      return false;
    }
  }

  return validateUserOnBlacklist(_.get(data, 'author'));
};

module.exports = {
  validateRatingVote, validateObjectType,
};
