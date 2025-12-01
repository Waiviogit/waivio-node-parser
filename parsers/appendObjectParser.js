const { Wobj, WobjectPendingUpdatesModel } = require('models');
const _ = require('lodash');
const { appendObjectValidator } = require('validator');
const { commentRefSetter } = require('utilities/commentRefService');
const jsonHelper = require('utilities/helpers/jsonHelper');
const updateSpecificFieldsHelper = require('utilities/helpers/updateSpecificFieldsHelper');
const { FIELDS_NAMES } = require('@waivio/objects-processor');
const { fieldUpdateNotification } = require('../utilities/notificationsApi/notificationsUtil');

const parse = async (operation, metadata) => {
  const data = await formField({
    operation,
    metadata,
  });
  if (!data) return;

  const {
    result,
    error,
  } = await appendObject(data, operation, metadata);

  if (result) {
    console.log(`Field ${metadata.wobj.field.name}, with value: ${metadata.wobj.field.body} added to wobject ${data.author_permlink}!\n`);
    return true;
  }
  if (error) {
    console.error(error.message);
    return false;
  }
};

const appendObject = async (data, operation, metadata) => {
  try {
    await appendObjectValidator.validate(data, operation);
    await commentRefSetter.addAppendWobj(
      `${data.field.author}_${data.field.permlink}`,
      data.author_permlink,
    );
    const {
      result,
      error,
    } = await Wobj.addField(data);
    if (error) throw error;

    await updateSpecificFieldsHelper.update({
      author: data.field.author,
      permlink: data.field.permlink,
      authorPermlink: data.author_permlink,
      metadata,
    });

    await fieldUpdateNotification({
      authorPermlink: data.author_permlink,
      field: data.field,
      initiator: data.field.creator,
    });
    return { result };
  } catch (error) {
    return { error };
  }
};

const trimObjectValues = (body) => {
  const obj = jsonHelper.parseJson(body, null);
  if (!obj) return body;
  for (const objElement in obj) {
    if (typeof obj[objElement] === 'string') {
      obj[objElement] = obj[objElement].trim();
    }
  }
  return JSON.stringify(obj);
};

const fieldTrimmer = {
  [FIELDS_NAMES.OPTIONS]: trimObjectValues,
  [FIELDS_NAMES.PRODUCT_ID]: trimObjectValues,
  [FIELDS_NAMES.COMPANY_ID]: trimObjectValues,
  [FIELDS_NAMES.WEIGHT]: trimObjectValues,
  [FIELDS_NAMES.DIMENSIONS]: trimObjectValues,
  [FIELDS_NAMES.AUTHORS]: trimObjectValues,
  [FIELDS_NAMES.PUBLISHER]: trimObjectValues,
  [FIELDS_NAMES.WIDGET]: trimObjectValues,
  [FIELDS_NAMES.MERCHANT]: trimObjectValues,
  [FIELDS_NAMES.MANUFACTURER]: trimObjectValues,
  [FIELDS_NAMES.BRAND]: trimObjectValues,
  [FIELDS_NAMES.FEATURES]: trimObjectValues,
  [FIELDS_NAMES.MENU_ITEM]: trimObjectValues,
  default: (body) => body.trim(),
};

const formField = async ({
  operation,
  metadata,
}) => {
  const data = {
    author_permlink: operation.parent_permlink,
    field: {
      creator: metadata.wobj.creator,
      author: operation.author,
      permlink: operation.permlink,
    },
  };
  for (const fieldItem in metadata.wobj.field) {
    data.field[fieldItem] = metadata.wobj.field[fieldItem];
  }

  data.field.body = (fieldTrimmer[data.field.name] || fieldTrimmer.default)(data.field.body);

  if (data.field.name === FIELDS_NAMES.HTML_CONTENT) {
    return getVolumes(data);
  }

  return data;
};

const getVolumes = async (data) => {
  const {
    field,
    author_permlink: authorPermlink,
  } = data;

  const volumeFields = ['partNumber', 'totalParts', 'id'];
  if (!volumeFields.every((key) => field?.[key])) return data;
  if (field.totalParts > 10 || field.totalParts < 1) return null;
  if (field.partNumber > 10 || field.partNumber < 1) return null;
  if (field.totalParts === 1 && field.partNumber !== 1) return null;
  if (field.partNumber > field.totalParts) return null;
  if (field.totalParts === 1) {
    return {
      author_permlink: authorPermlink,
      field: _.omit(field, volumeFields),
    };
  }

  const pendingDocs = await WobjectPendingUpdatesModel.getDocumentsCountByAuthorPermlinkId({
    authorPermlink, id: field.id,
  });

  if ((pendingDocs + 1) === field.totalParts) {
    const storedParts = await WobjectPendingUpdatesModel.getDocumentsByAuthorPermlinkId({
      authorPermlink,
      id: field.id,
    });
    if (storedParts.some((p) => p.partNumber === field.partNumber)) return null;

    const allParts = [
      ...storedParts,
      {
        ...field,
      },
    ].sort((a, b) => a.partNumber - b.partNumber);

    const accumulatedBody = allParts.reduce((acc, part) => `${acc}${part.body}`, '');

    await WobjectPendingUpdatesModel.deleteDocumentsByAuthorPermlinkId({
      authorPermlink,
      id: field.id,
    });

    return {
      author_permlink: authorPermlink,
      field: {
        ..._.omit(field, [...volumeFields, 'body']),
        body: accumulatedBody,
      },
    };
  }

  await WobjectPendingUpdatesModel.createDocument({
    name: field.name,
    body: field.body,
    locale: field.locale,
    creator: field.creator,
    author: field.author,
    permlink: field.permlink,
    id: field.id,
    authorPermlink,
    partNumber: field.partNumber,
    totalParts: field.totalParts,
  });

  return null;
};

module.exports = { parse, getVolumes };
