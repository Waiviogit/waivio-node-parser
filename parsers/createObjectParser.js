const { Wobj, User } = require('models');
const { createObjectValidator } = require('validator');
const { commentRefSetter, commentRefGetter } = require('utilities/commentRefService');
const { wobjectHelper, userHelper } = require('utilities/helpers');
const { OBJECT_TYPES_FOR_GROUP_ID } = require('constants/wobjectsData');
const _ = require('lodash');
const crypto = require('node:crypto');
const { createEdgeNGrams } = require('../utilities/helpers/updateSpecificFieldsHelper');
const { publishToChannel } = require('../utilities/redis/redisSetter');

const parse = async (operation, metadata) => {
  const data = {
    author_permlink: operation.permlink,
    author: operation.author,
    creator: metadata.wobj.creator,
    app: metadata.app,
    community: metadata.community,
    is_posting_open: metadata.wobj.is_posting_open,
    is_extending_open: metadata.wobj.is_extending_open,
    default_name: metadata.wobj.default_name,
    search: createEdgeNGrams(operation.permlink.replace(/[.%?+*|{}[\]()<>“”^'"\\\-_=!&$:]/g, ''), 'permlink'),
  };
  const { wobject, error } = await createObject(data, operation);
  if (error) console.error(error.message);
  if (wobject) console.log(`Waivio object ${data.default_name} created!\n`);

  const locale = _.get(metadata, 'wobj.locale', 'en-US');
  await wobjectHelper.addSupposedUpdates(wobject, locale, metadata);
  await publishIfDatafinityObjectCreated(data, metadata);
};

const createObject = async (data, operation) => {
  try {
    await createObjectValidator.validate(data, operation);

    const objectTypeRef = await commentRefGetter.getCommentRef(`${operation.parent_author}_${operation.parent_permlink}`);
    data.object_type = objectTypeRef.name;
    if (_.includes(OBJECT_TYPES_FOR_GROUP_ID, data.object_type)) {
      data.metaGroupId = crypto.randomUUID();
    }

    const { wObject, error } = await Wobj.create(data);
    if (error) return { error };

    await commentRefSetter.addWobjRef(`${data.author}_${data.author_permlink}`, data.author_permlink);
    await userHelper.checkAndCreateUser(data.creator);
    await User.increaseWobjectWeight({
      name: data.creator,
      author_permlink: data.author_permlink,
      weight: 1,
    });

    return { wobject: wObject.toObject() };
  } catch (error) {
    return { error };
  }
};

const publishIfDatafinityObjectCreated = async (data, metadata) => {
  if (!metadata.datafinityObject) return;

  await publishToChannel({
    channel: 'datafinityObject',
    msg: JSON.stringify({
      user: data.creator,
      author_permlink: data.author_permlink,
      ...(metadata.importId && { importId: metadata.importId }),
    }),
  });
};

module.exports = { parse };
