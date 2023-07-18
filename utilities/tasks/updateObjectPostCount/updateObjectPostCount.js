const { WObject, Post } = require('database').models;
const { OBJECT_TYPES } = require('../../../constants/wobjectsData');

const updateObjectPostCount = async () => {
  try {
    const objects = WObject.find(
      { object_type: { $in: [OBJECT_TYPES.PRODUCT, OBJECT_TYPES.BOOK] } },
      { author_permlink: 1 },
    );

    for await (const object of objects) {
      const authorPermlink = object.author_permlink;
      const postsCount = await Post.distinct('_id', { 'wobjects.author_permlink': authorPermlink }).count();

      if (!postsCount) continue;

      await WObject.updateOne(
        { author_permlink: authorPermlink },
        { count_posts: postsCount },
      );
    }
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = updateObjectPostCount;
