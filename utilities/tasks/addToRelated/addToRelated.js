/* eslint-disable camelcase */
const _ = require('lodash');
const { Post, WObject } = require('database').models;
const postHelper = require('utilities/helpers/postHelper');
const { OBJECT_TYPES_WITH_ALBUM } = require('../../../constants/wobjectsData');
const { addToRelated } = require('../../helpers/postHelper');

exports.addToRelatedFromObjects = async () => {
  const batchSize = 1000;

  while (true) {
    const objects = await WObject
      .find(
        { processed: false, object_type: { $in: OBJECT_TYPES_WITH_ALBUM } },
        { author_permlink: 1 },
      )
      .limit(batchSize)
      .lean();
    if (!objects?.length) break;

    for (const object of objects) {
      const posts = await Post.find(
        { 'wobjects.author_permlink': object.author_permlink },
        {
          author: 1, permlink: 1, json_metadata: 1,
        },
      ).lean();
      for (const post of posts) {
        const postAuthorPermlink = `${post.author}_${post.permlink}`;
        const images = getImages(post.json_metadata);
        await addToRelated([object], images, postAuthorPermlink);
      }
      await WObject.updateOne(
        { author_permlink: object.author_permlink },
        { $set: { processed: true } },
      );
    }
  }
};

// initial to fill all posts
exports.fillRelated = async () => {
  const posts = await Post.find({ notProcessed: true }).limit(1000).lean();
  if (_.isEmpty(posts)) {
    console.log('task completed');
    process.exit();
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
  try {
    return _.get(JSON.parse(json), 'image', []);
  } catch (e) {
    return [];
  }
};
