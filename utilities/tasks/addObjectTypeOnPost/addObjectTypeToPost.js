const { WObject, Post } = require('database').models;

module.exports = async () => {
  const wobjects = await WObject.find(
    { notProcessed: false }, { author_permlink: 1, object_type: 1, _id: -1 },
  ).lean();
  console.table(wobjects);
  for (const wobject of wobjects) {
    await Post.updateMany(
      { 'wobjects.author_permlink': wobject.author_permlink },
      { 'wobjects.$.objectType': wobject.object_type },
    );
    await WObject.updateOne({ author_permlink: wobject.author_permlink }, { notProcessed: false });
  }
  console.info('task completed');
};
