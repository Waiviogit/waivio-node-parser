const { HiddenComment, faker } = require('test/testHelper');

const Create = async ({ userName, author, permlink } = {}) => {
  const data = {
    userName: userName || faker.random.string(),
    author: author || faker.random.string(),
    permlink: permlink || faker.random.string(),
  };

  const hiddenComment = new HiddenComment(data);
  await hiddenComment.save();
  hiddenComment.toObject();

  return hiddenComment;
};

module.exports = { Create };
