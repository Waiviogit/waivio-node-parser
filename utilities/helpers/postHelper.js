const _ = require('lodash');
const moment = require('moment');
const {
  Post, CommentModel, Wobj, relatedAlbum,
} = require('models');
const { ObjectId } = require('mongoose').Types;
const { postsUtil } = require('utilities/steemApi');
const guestHelpers = require('utilities/guestOperations/guestHelpers');
const postByTagsHelper = require('utilities/helpers/postByTagsHelper');
const {
  RE_WOBJECT_LINK, RE_WOBJECT_AUTHOR_PERMLINK, RE_WOBJECT_AUTHOR_PERMLINK_ENDS, RE_HTTPS,
} = require('constants/regExp');

exports.objectIdFromDateString = (dateStr) => {
  const timestamp = moment.utc(dateStr).format('x');
  let str = `${Math.floor(timestamp / 1000).toString(16)}${getRandomInt(10000, 99999)}00000000000`;
  let id;
  try {
    id = new ObjectId(str);
  } catch (e) {
    str = `${Math.floor(moment.utc().valueOf() / 1000).toString(16)}${getRandomInt(10000, 99999)}00000000000`;
    id = new ObjectId(str);
  }
  return id;
};

const getRandomInt = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

exports.updateExpiredPost = async (author, permlink) => {
  const { post: dbPost } = await Post.findOne({ author, permlink });
  if (!dbPost || !dbPost.author) return;

  const { post } = await postsUtil.getPost(dbPost.root_author, permlink);
  if (!post || !post.author || (parseFloat(post.total_payout_value) === 0 && parseFloat(post.curator_payout_value) === 0)) {
    return;
  }
  const { result } = await Post.update(Object.assign(_.pick(post, ['permlink', 'total_payout_value', 'curator_payout_value', 'pending_payout_value']), { author }));
  if (result) console.log(`Post ${author}/${permlink} updated after 7 days`);
};

exports.createPost = async ({
  author, permlink, fromTTL = false, commentParser,
}) => {
  const { post, err } = await postsUtil.getPost(author, permlink);

  if (err || !post.author || !post.body) return console.error(`Post @${author}/${permlink} not found or was deleted!`);
  const metadata = this.parseMetadata(post.json_metadata);
  if (!metadata) return;
  await commentParser.postSwitcher({
    operation: {
      author,
      permlink,
      json_metadata: post.json_metadata,
      body: post.body,
      title: post.title,
      parent_author: post.parent_author,
      parent_permlink: post.parent_permlink,
    },
    metadata,
    post,
    fromTTL,
  });
};

exports.parseMetadata = (metadata) => {
  try {
    if (metadata !== '') {
      return JSON.parse(metadata);
    }
  } catch (e) {
    console.error(e.message);
    return '';
  }
};

exports.updatePostVotes = async (author, permlink) => {
  const { post: postInDb, error } = await Post.findOne({ root_author: author, permlink });
  if (!postInDb || error) return;
  const { post } = await postsUtil.getPost(author, permlink);
  if (!post) return;
  post.author = postInDb.author;
  post.active_votes = _.map(post.active_votes, (vote) => ({
    voter: vote.voter,
    weight: Math.round(vote.rshares * 1e-6),
    percent: vote.percent,
    rshares: vote.rshares,
  }));
  _.forEach(postInDb.active_votes, (dbVote) => {
    if (dbVote.voter.includes('_')) {
      post.active_votes.push(dbVote);
    }
  });

  await Post.update(post);
};

exports.guestCommentFromTTL = async (author, permlink) => {
  let metadata;
  const { post: comment, err } = await postsUtil.getPost(author, permlink);
  if (err || !comment) return;
  try {
    metadata = JSON.parse(comment.json_metadata);
  } catch (error) { }
  const guestInfo = await guestHelpers.getFromMetadataGuestInfo(
    { operation: { author }, metadata },
  );
  if (!guestInfo) return;
  delete comment.active_votes;
  const { error } = await CommentModel.createOrUpdate({ ...comment, guestInfo });
  if (error) return console.error(error);
  console.log(`Guest comment created: ${author}/${permlink}, guest name: ${guestInfo.userId}`);
};

/**
 * in first part of method we search for links on waivio objects, and check if they in metadata,
 * if not add them to wobj.wobjects and recount wobject percent
 * in second part we check weather post has wobjects or just tags and make calculations
 */
exports.parseBodyWobjects = async (metadata, postBody = '') => {
  const bodyLinks = postBody.match(RE_WOBJECT_LINK);
  if (!_.isEmpty(bodyLinks)) {
    const metadataWobjects = _.concat(
      _.get(metadata, 'tags', []),
      _.map(_.get(metadata, 'wobj.wobjects', []), 'author_permlink'),
    );
    const wobj = _.get(metadata, 'wobj.wobjects', []);
    for (const link of bodyLinks) {
      const authorPermlink = _.get(link.match(RE_WOBJECT_AUTHOR_PERMLINK), '[1]', _.get(link.match(RE_WOBJECT_AUTHOR_PERMLINK_ENDS), '[1]'));
      if (authorPermlink && !_.includes(metadataWobjects, authorPermlink)) {
        const { wobject } = await Wobj.getOne({ author_permlink: authorPermlink });
        if (!wobject) continue;
        wobj.push({ author_permlink: wobject.author_permlink });
      }
    }
    if (!_.isEmpty(wobj)) {
      const wobjWithPercent = _.filter(wobj, (w) => w.percent !== 0);
      _.forEach(wobj, (w) => {
        if (w.percent !== 0) w.percent = Math.floor(100 / wobjWithPercent.length);
      });
      metadata.wobj = { wobjects: wobj };
    }
  }

  const metadataWobjects = _.get(metadata, 'wobj.wobjects');
  const isSimplePost = _.isEmpty(metadataWobjects);
  const postTags = _.get(metadata, 'tags', []);

  if (_.isArray(metadataWobjects) && !isSimplePost && postTags.length) {
    let tags = await postByTagsHelper.wobjectsByTags(metadata.tags);
    const wobj = metadata.wobj.wobjects;
    tags = _.filter(tags, (tag) => !_.includes(_.map(wobj, 'author_permlink'), tag.author_permlink));
    _.forEach(tags, (tag) => wobj.push({ author_permlink: tag.author_permlink, percent: 0 }));
    metadata.wobj = { wobjects: wobj || [] };
  } else if (isSimplePost && postTags.length) {
    // case if post has no wobjects, then need add wobjects by tags, or create if it not exist
    const wobjects = await postByTagsHelper.wobjectsByTags(postTags);
    metadata.wobj = { wobjects: wobjects || [] };
  }
  return _.chain(metadata).get('wobj.wobjects', []).filter((w) => w.percent >= 0 && w.percent <= 100).value();
};

exports.addToRelated = async (wobjects, images = [], postAuthorPermlink) => {
  if (_.isEmpty(wobjects)) return;
  images = _
    .chain(images)
    .uniq()
    .filter((img) => typeof img === 'string' && img.match(RE_HTTPS))
    .value();

  if (_.isEmpty(images)) {
    for (const el of wobjects) {
      const { result } = await relatedAlbum.findOne({
        wobjAuthorPermlink: el.author_permlink,
        postAuthorPermlink,
      });

      result && await relatedAlbum.deleteOne({
        wobjAuthorPermlink: el.author_permlink,
        postAuthorPermlink,
      });
    }
    return;
  }

  for (const wobject of wobjects) {
    await relatedAlbum.update({
      images,
      postAuthorPermlink,
      wobjAuthorPermlink: wobject.author_permlink,
    });
  }
};
