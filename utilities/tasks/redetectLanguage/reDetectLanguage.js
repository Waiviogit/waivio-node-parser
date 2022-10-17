const { Post } = require('database').models;
const _ = require('lodash');
const {
  detectPostLanguageHelper,
} = require('utilities/helpers');

module.exports = async () => {
  const posts = await Post.find({ language: null }).lean();
  if (_.isEmpty(posts)) return;
  for (const post of posts) {
    if (post.reblog_to) {
      const reblogged = await Post.findOne({
        author: _.get(post, 'reblog_to.author'),
        permlink: _.get(post, 'reblog_to.permlink'),
      }).lean();
      if (!reblogged) continue;
      const { language, languages } = await detectPostLanguageHelper(reblogged);
      await Post.updateOne({ _id: post._id }, { language, languages });
      continue;
    }
    const { language, languages } = await detectPostLanguageHelper(post);
    await Post.updateOne({ _id: post._id }, { language, languages });
  }
};
