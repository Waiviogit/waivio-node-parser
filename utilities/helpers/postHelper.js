const _ = require('lodash');
const moment = require('moment');
const {
  Post, CommentModel, Wobj, relatedAlbum, CommentRef, App,
} = require('models');
const { ObjectId } = require('mongoose').Types;
const { postsUtil } = require('utilities/steemApi');
const seoService = require('utilities/socketClient/seoService');
const guestHelpers = require('utilities/guestOperations/guestHelpers');
const postByTagsHelper = require('utilities/helpers/postByTagsHelper');
const {
  RE_HTTPS, RE_HASHTAGS, HOSTS_TO_PARSE_LINKS, WOBJECT_REF,
} = require('constants/regExp');
const { OBJECT_TYPES_WITH_ALBUM } = require('constants/wobjectsData');
const redisSetter = require('utilities/redis/redisSetter');
const redisGetter = require('utilities/redis/redisGetter');
const jsonHelper = require('utilities/helpers/jsonHelper');
const { REDIS_KEYS } = require('constants/parsersData');
const { postWithWobjValidator } = require('../../validator');
const detectPostLanguageHelper = require('./detectPostLanguageHelper');
const { commentRefSetter } = require('../commentRefService');
const { COMMENT_REF_TYPES } = require('../../constants/common');
const { roundDown } = require('./calcHelper');

const getHostsToParseObjects = async () => {
  const cache = await redisGetter.getAsync({ key: REDIS_KEYS.HOSTS_TO_PARSE_OBJECTS });
  if (cache) return jsonHelper.parseJson(cache, []);
  const { result = [] } = await App.find({ advanced: true }, { host: 1 });
  const dataToSet = [...HOSTS_TO_PARSE_LINKS, ...result.map((el) => el.host)];
  await redisSetter.set({
    key: REDIS_KEYS.HOSTS_TO_PARSE_OBJECTS,
    value: JSON.stringify(dataToSet),
  });
  return dataToSet;
};

exports.setHostsToParseObjects = async () => {
  const { result = [] } = await App.find({ advanced: true }, { host: 1 });
  const dataToSet = [...HOSTS_TO_PARSE_LINKS, ...result.map((el) => el.host)];
  await redisSetter.set({
    key: REDIS_KEYS.HOSTS_TO_PARSE_OBJECTS,
    value: JSON.stringify(dataToSet),
  });
};

const getRegExToParseObjects = async () => {
  const hosts = await getHostsToParseObjects();
  return RegExp(`${hosts.map((el) => `${el}${WOBJECT_REF}`).join('|')}`);
};

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
  if (!post) return;
  if (err || !post.author || !post.body) return console.error(`Post @${author}/${permlink} not found or was deleted!`);
  if (post.parent_author) return;
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
  return true;
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
  if (error) return console.error(error.message);
  console.log(`Guest comment created: ${author}/${permlink}, guest name: ${guestInfo.userId}`);
};

const isFileLink = (url) => {
  try {
    const parsedUrl = new URL(url);
    const { pathname } = parsedUrl;
    const fileRegex = /[^\/]+\.[a-zA-Z0-9]+$/;

    return fileRegex.test(pathname);
  } catch (e) {
    // If the URL is invalid, return false
    return false;
  }
};

const extractLinks = (text) => {
  const urlPattern = /https?:\/\/[^\s/$.?#].[^\s)"]*/gm;
  const links = text.match(urlPattern);
  return links || [];
};

const isValidHttpLink = (link = '') => {
  const httpRegex = /^https?:\/\/[^\s/$.?#].[^\s]*$/;
  return httpRegex.test(link);
};

exports.getLinksFromPost = (body, metadata) => {
  const links = extractLinks(body);
  const validLinks = [];

  for (const link of links) {
    if (!isFileLink(link)) validLinks.push(link);
  }
  const metadataLinks = Array.isArray(metadata?.links) ? metadata.links : [];

  return _.uniq([...validLinks, ...metadataLinks]).filter(isValidHttpLink);
};

exports.getMentionsFromPost = (body = '') => {
  // Regular expression to match URLs
  const urlRegex = /https?:\/\/[^\s/$.?#].[^\s]*/gm;
  const emailRegex = /[\w-\.]+@([\w-]+\.)+[\w-]{2,4}/gm;

  // Remove URLs from the body
  const bodyWithoutUrls = body
    .replace(urlRegex, '')
    .replace(emailRegex, '');

  // Extract mentions from the remaining text
  const mentions = bodyWithoutUrls.match(/@[a-z0-9._-]+/gm);

  return _.uniq(
    _.compact(
      _.map(mentions, (mention) => {
        mention = mention.slice(1); // Remove the first '@' symbol from each mention
        const parts = mention.split('.');
        let processedMention;
        if (parts.length > 1 && parts[1].length >= 3) {
          processedMention = mention;
        } else {
          processedMention = parts[0];
        }
        // Remove any trailing dot
        processedMention = processedMention.replace(/\.$/, '');
        // Ensure minimum length of 3 characters
        return processedMention.length >= 3 ? processedMention : null;
      }),
    ),
  );
};

/**
 * in first part of method we search for links on waivio objects, and check if they in metadata,
 * if not add them to wobj.wobjects and recount wobject percent
 * in second part we check weather post has wobjects or just tags and make calculations
 */
exports.parseBodyWobjects = async (metadata, postBody = '') => {
  const hostObjectsRegex = await getRegExToParseObjects();

  const bodyLinks = _.uniq([
    ...getBodyLinksArray(postBody, RE_HASHTAGS),
    ...getBodyLinksArray(postBody, hostObjectsRegex),
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

const restoreOldPost = async ({ author, permlink }) => {
  const { post, err } = await postsUtil.getPost(author, permlink);
  if (!post) return;
  if (err || !post.author || !post.body) return;
  if (post.parent_author) return;
  const metadata = this.parseMetadata(post.json_metadata);
  if (!metadata) return;
  post.wobjects = await this.parseBodyWobjects(metadata, post.body);
  if (!postWithWobjValidator.validate({ wobjects: post.wobjects })) {
    return;
  }
  const { language, languages } = await detectPostLanguageHelper(post);
  post.language = language;
  post.languages = languages;
  post._id = new ObjectId(moment.utc(post.created).unix());
  post.createdAt = moment.utc(post.created).format();

  const { result: updPost, error } = await Post.create(post);
  if (error) return;
  await commentRefSetter.addPostRef(
    `${post.root_author}_${post.permlink}`,
    post.wobjects,
  );
  await this.addToRelated(post.wobjects, metadata.image, `${post.author}_${post.permlink}`);
  return true;
};

exports.parseCommentBodyWobjects = async ({
  body = '', author, permlink,
}) => {
  const hostObjectsRegex = await getRegExToParseObjects();

  const matches = _.uniq([
    ...getBodyLinksArray(body, RE_HASHTAGS),
    ...getBodyLinksArray(body, hostObjectsRegex),
  ]);
  if (_.isEmpty(matches)) return false;

  let { post } = await Post.findByBothAuthors({
    author, permlink, select: { wobjects: 1 },
  });

  const { commentRef } = await CommentRef.getRef(`${author}_${permlink}`);

  if (commentRef?.type === COMMENT_REF_TYPES.wobjType) return;

  if (!post) {
    const created = await restoreOldPost({ author, permlink });
    if (!created) return false;
    ({ post } = await Post.findByBothAuthors({
      author, permlink, select: { wobjects: 1 },
    }));
  }

  const { result } = await Wobj.find(
    { author_permlink: { $in: matches } },
    { author_permlink: 1, object_type: 1, _id: 0 },
  );
  if (_.isEmpty(result)) return false;

  const newObjects = _.differenceBy(result, _.get(post, 'wobjects', []), 'author_permlink');

  if (_.isEmpty(newObjects)) return false;

  for (const newObj of newObjects) {
    if (!post?._id) continue;
    await Wobj.pushNewPost({ author_permlink: newObj.author_permlink, post_id: post._id });
  }

  const wobjects = _.get(post, 'wobjects', []);
  const totalObjects = _.uniqBy([...newObjects, ...wobjects], 'author_permlink');
  const withZeroValues = wobjects.filter((w) => w.percent === 0);
  const positivePercentLength = totalObjects.length - withZeroValues.length;

  const newPercent = roundDown(100 / positivePercentLength, 2);

  const objectsToUpdate = totalObjects.map((el) => ({
    ...el,
    percent: el.percent === 0 ? el.percent : newPercent,
  }));

  await Post.setWobjectsToPost({ author, permlink, wobjects: objectsToUpdate });
  return true;
};

exports.hideCommentWobjectsFromPost = async ({ author, permlink, body = '' }) => {
  const hostObjectsRegex = await getRegExToParseObjects();

  const authorPermlinks = _.uniq([
    ...getBodyLinksArray(body, RE_HASHTAGS),
    ...getBodyLinksArray(body, hostObjectsRegex),
  ]);
  if (_.isEmpty(authorPermlinks)) return false;
  return !!(await Post.removeWobjectsFromPost({ author, permlink, authorPermlinks })).result;
};

exports.addPostToSitemap = ({ host, author, permlink }) => {
  if (!host) return;
  if (/(waivio\.com|waiviodev\.com)/.test(host)) return;
  seoService.sitemap.addSitemapPost({ host, author, permlink });
};

const getBodyLinksArray = (body, regularExpression) => _
  .chain(body.match(new RegExp(regularExpression, 'gm')))
  .reduce((acc, link) => [...acc, _.compact(link.match(regularExpression))[1]], [])
  .compact()
  .value();
