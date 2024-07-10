const { Post } = require('database').models;
const postHelper = require('utilities/helpers/postHelper');
const jsonHelper = require('utilities/helpers/jsonHelper');

const addMentionsToPost = async () => {
  while (true) {
    const posts = await Post.find({
      notProcessed: true,
    }).limit(1000).lean();
    if (!posts?.length) break;

    for (const post of posts) {
      const metadata = jsonHelper.parseJson(post.json_metadata, null);

      const links = postHelper.getLinksFromPost(post.body, metadata);
      const mentions = postHelper.getMentionsFromPost(post.body);
      const notProcessed = false;

      await Post.updateOne({ _id: post._id }, { links, mentions, notProcessed });
    }
  }
  console.log('task finished');
};

module.exports = addMentionsToPost;
