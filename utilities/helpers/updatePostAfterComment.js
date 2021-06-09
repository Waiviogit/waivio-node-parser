const { setExpiredPostTTL } = require('utilities/redis/redisSetter');
const { postsUtil } = require('utilities/steemApi');
const { Post } = require('database').models;

/**
 * Update post "children" counter by comment "author" and "permlink"
 * @param author Author of comment on post
 * @param permlink Permlink of comment on post
 * @param isFirst in order not to get into the infinity cycle of ExpiredPostTTL creation
 * @returns {Promise<void>}
 */
const updateCounters = async (author, permlink, isFirst) => {
  const { post: comment, err } = await postsUtil.getPost(author, permlink);

  if (err) {
    return isFirst
      ? setExpiredPostTTL('hiveComment', `${author}/${permlink}`, 10)
      : console.error(`[Update Post counters] Comment ${author}/${permlink} not exist or was deleted!`);
  }

  if (!comment || !comment.author) {
    return console.error(`[Update Post counters] Comment ${author}/${permlink} not exist or was deleted!`);
  }
  const { post, err: error } = await postsUtil.getPost(comment.root_author, comment.root_permlink);
  if (error) return console.error(error && error.message ? error.message : error);

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
