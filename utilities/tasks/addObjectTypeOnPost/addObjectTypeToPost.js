const { WObject, Post } = require('database').models;
const _ = require('lodash');

exports.addObjectType = async () => {
  const posts = await Post.find({ notProcessed: true }, { wobjects: 1 }).limit(1000).lean();
  if (_.isEmpty(posts)) {
    console.log('task completed');
    process.exit();
  }
  for (const post of posts) {
    if (_.isEmpty(_.get(post, 'wobjects'))) {
      console.log(post?._id, 'addObjectType');
      await Post.updateOne({ _id: post._id }, { notProcessed: false });
    }

    const wobjects = await WObject.find(
      { author_permlink: { $in: _.map(post.wobjects, 'author_permlink') } },
      { author_permlink: 1, object_type: 1 },
    );

    _.forEach(post.wobjects, (el) => {
      const wobj = _.find(wobjects, (w) => w.author_permlink === el.author_permlink);
      el.object_type = _.get(wobj, 'object_type');
    });
    console.log(post?._id, 'addObjectType');
    await Post.updateOne({ _id: post._id }, { notProcessed: false, wobjects: post.wobjects });
  }
  await this.addObjectType();
};
