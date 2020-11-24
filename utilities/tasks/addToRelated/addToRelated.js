/* eslint-disable camelcase */
const _ = require('lodash');
const { Post } = require('database').models;
const postHelper = require('utilities/helpers/postHelper');

exports.fillRelated = async () => {
  const posts = await Post.find({ notProcessed: true }).limit(1000).lean();
  if (_.isEmpty(posts)) {
    console.log('task completed');
    return;
  }
  for (const post of posts) {
    const {
      author, permlink, json_metadata, wobjects,
    } = post;
    if (_.isEmpty(wobjects)) {
      await Post.updateOne({ author, permlink }, { notProcessed: false });
      continue;
    }
    const images = getImages(json_metadata);
    if (_.isEmpty(images)) {
      await Post.updateOne({ author, permlink }, { notProcessed: false });
      continue;
    }
    await postHelper.addToRelated(wobjects, images, `${author}_${permlink}`);
    await Post.updateOne({ author, permlink }, { notProcessed: false });
  }
  await this.fillRelated();
};

const getImages = (json) => {
  let metadata;
  try {
    metadata = JSON.parse(json);
    return _.get(metadata, 'image', []);
  } catch (e) {
    return [];
  }
};
