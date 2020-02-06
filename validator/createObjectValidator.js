const _ = require('lodash');
const { commentRefGetter } = require('utilities/commentRefService');
const { validateUserOnBlacklist } = require('validator/userValidator');

const validate = async (data, operation) => {
  if (!validateUserOnBlacklist(operation.author) || !validateUserOnBlacklist(data.creator)) {
    throw new Error("Can't create object, user in blacklist!");
  }
  validateFields(data);
  await validatePostLinks(data, operation);
};

const validateFields = (data) => {
  const requiredFieldsCreateObject = 'author_permlink,author,creator,default_name'.split(',');

  requiredFieldsCreateObject.forEach((field) => {
    if (_.isNil(data[field])) {
      throw new Error("Can't create object, not all required fields is filling!");
    }
  });
};

const validatePostLinks = async (data, operation) => {
  const result = await commentRefGetter.getCommentRef(
    `${operation.parent_author}_${operation.parent_permlink}`,
  );

  if (!result || !result.type || result.type !== 'wobj_type') {
    throw new Error("Can't create object, parent post isn't create Object Type post or wrong object type!");
  }
};

module.exports = { validate };
