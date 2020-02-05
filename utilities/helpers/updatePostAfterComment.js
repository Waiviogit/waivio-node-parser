const { postsUtil } = require('utilities/steemApi');
const { Post } = require('database').models;

const updateCounters = async (author, permlink) => {
  const { post, err } = await postsUtil.getPost(author, permlink);
  if (err) {
    console.error(err && err.message ? err.message : err);
    return;
  }
  if (post && post.author) {
    try {
      const res = await Post.updateOne({
        root_author: post.author, permlink: post.permlink,
      }, {
        children: post.children,
      });
      if (res.ok) console.log(`Post @${author}/${permlink} updated!`);
    } catch (error) {
      console.error(error);
    }
  }
};

module.exports = { updateCounters };
