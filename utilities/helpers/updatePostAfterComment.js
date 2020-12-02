const { postsUtil } = require('utilities/steemApi');
const { Post } = require('database').models;

/**
 * Update post "children" counter by comment "author" and "permlink"
 * @param author Author of comment on post
 * @param permlink Permlink of comment on post
 * @param parentAuthor
 * @param parentPermlink
 * @returns {Promise<void>}
 */
const updateCounters = async (author, permlink, parentAuthor, parentPermlink) => {
  let rootAuthor, rootPermlink;
  const { post: comment, err } = await postsUtil.getPost(author, permlink);

  if (err) {
    const { post: parentPost, err: parentError } = await postsUtil.getPost(parentAuthor, parentPermlink);
    if (parentError || !parentPost) return console.error(`[Update Post counters] Comment ${parentAuthor}/${parentPermlink} not exist or was deleted!`);
    rootAuthor = parentPost.root_author;
    rootPermlink = parentPost.root_permlink;
  } else {
    if (!comment || !comment.author) {
      return console.error(`[Update Post counters] Comment ${author}/${permlink} not exist or was deleted!`);
    }
    rootAuthor = comment.root_author;
    rootPermlink = comment.root_permlink;
  }

  const { post, err: error } = await postsUtil.getPost(rootAuthor, rootPermlink);
  if (error) {
    console.error(error && error.message ? error.message : error);
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
    } catch (e) {
      console.error(e);
    }
  }
};

module.exports = { updateCounters };
