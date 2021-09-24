const _ = require('lodash');
const moment = require('moment');
const {
  Post, CommentModel, Wobj, relatedAlbum,
} = require('models');
const { ObjectId } = require('mongoose').Types;
const { postsUtil } = require('utilities/steemApi');
const guestHelpers = require('utilities/guestOperations/guestHelpers');
const postByTagsHelper = require('utilities/helpers/postByTagsHelper');
const { RE_HTTPS, RE_WOBJECT_REF, RE_HASHTAGS } = require('constants/regExp');
const { OBJECT_TYPES_WITH_ALBUM } = require('constants/wobjectsData');

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
  const bodyLinks = _.uniq([
    ...getBodyLinksArray(postBody, RE_HASHTAGS),
    ...getBodyLinksArray(postBody, RE_WOBJECT_REF),
  ]);
  if (!_.isEmpty(bodyLinks)) {
    const metadataWobjects = _.concat(
      _.get(metadata, 'tags', []),
      _.map(_.get(metadata, 'wobj.wobjects', []), 'author_permlink'),
    );
    const wobj = _.get(metadata, 'wobj.wobjects', []);
    for (const link of bodyLinks) {
      if (!_.includes(metadataWobjects, link)) {
        const { wobject } = await Wobj.getOne({
          author_permlink: link,
          select: { author_permlink: 1, object_type: 1 },
        });
        if (!wobject) continue;
        wobj.push({
          author_permlink: wobject.author_permlink,
          object_type: wobject.object_type,
        });
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
    _.forEach(tags, (tag) => wobj.push({
      author_permlink: tag.author_permlink,
      object_type: tag.object_type,
      percent: 0,
    }));
    metadata.wobj = { wobjects: wobj || [] };
  } else if (isSimplePost && postTags.length) {
    // case if post has no wobjects, then need add wobjects by tags, or create if it not exist
    const wobjects = await postByTagsHelper.wobjectsByTags(postTags);
    metadata.wobj = { wobjects: wobjects || [] };
  }
  return _
    .chain(metadata)
    .get('wobj.wobjects', [])
    .uniqBy('author_permlink')
    .filter((w) => w.percent >= 0 && w.percent <= 100)
    .value();
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
    const { wobject: result } = await Wobj
      .getOne({ author_permlink: wobject.author_permlink, select: { object_type: 1 } });
    if (!_.includes(OBJECT_TYPES_WITH_ALBUM, _.get(result, 'object_type', ''))) continue;
    await relatedAlbum.update({
      images,
      postAuthorPermlink,
      wobjAuthorPermlink: wobject.author_permlink,
    });
  }
};

exports.parseCommentBodyWobjects = async ({ body = '', author, permlink }) => {
  const matches = _.uniq([
    ...getBodyLinksArray(body, RE_HASHTAGS),
    ...getBodyLinksArray(body, RE_WOBJECT_REF),
  ]);
  if (_.isEmpty(matches)) return false;

  const { post } = await Post.findByBothAuthors({
    author, permlink, select: { wobjects: 1, _id: 0 },
  });
  if (!post) return false;

  const { result } = await Wobj.find(
    { author_permlink: { $in: matches } },
    { author_permlink: 1, object_type: 1, _id: 0 },
  );
  if (_.isEmpty(result)) return false;

  const wobjects = _.differenceBy(result, _.get(post, 'wobjects', []), 'author_permlink');
  if (_.isEmpty(wobjects)) return false;

  await Post.addWobjectsToPost({ author, permlink, wobjects });
  return true;
};

exports.hideCommentWobjectsFromPost = async ({ author, permlink, body = '' }) => {
  const authorPermlinks = _.uniq([
    ...getBodyLinksArray(body, RE_HASHTAGS),
    ...getBodyLinksArray(body, RE_WOBJECT_REF),
  ]);
  if (_.isEmpty(authorPermlinks)) return false;
  return !!(await Post.removeWobjectsFromPost({ author, permlink, authorPermlinks })).result;
};

const getBodyLinksArray = (body, regularExpression) => _
  .chain(body.match(new RegExp(regularExpression, 'gm')))
  .reduce((acc, link) => [...acc, _.compact(link.match(regularExpression))[1]], [])
  .compact()
  .value();
