const _ = require('lodash');
const { WObject, Post } = require('database').models;
const postHelper = require('utilities/helpers/postHelper');

module.exports = async () => {
  const wobjects = WObject.find({}).lean().cursor();

  for await (const wobj of wobjects) {
    const posts = Post.find({ 'wobjects.author_permlink': wobj.author_permlink }).lean().cursor();
    for await (const post of posts) {
      const metadata = parseJson(post.json_metadata);
      if (!_.get(metadata, 'image')) continue;
      await postHelper.addToRelated([wobj], metadata.image);
    }
  }
  console.log('task completed');
};

const parseJson = (json) => {
  try {
    return JSON.parse(json);
  } catch (e) {
    return {};
  }
};
