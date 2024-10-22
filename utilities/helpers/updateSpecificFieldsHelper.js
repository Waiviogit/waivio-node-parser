const _ = require('lodash');
const config = require('config');
const {
  Wobj, App, Department, userShopDeselectModel, ObjectType,
} = require('models');
const { tagsParser } = require('utilities/restaurantTagsParser');
const { redisSetter } = require('utilities/redis');
const { processWobjects } = require('utilities/helpers/wobjectHelper');
const { validateMap } = require('validator/specifiedFieldsValidator');
const {
  FIELDS_NAMES, TAG_CLOUDS_UPDATE_COUNT, RATINGS_UPDATE_COUNT, SEARCH_FIELDS,
} = require('constants/wobjectsData');
const { restaurantStatus, rejectUpdate } = require('utilities/notificationsApi/notificationsUtil');
const siteHelper = require('utilities/helpers/sitesHelper');
const jsonHelper = require('utilities/helpers/jsonHelper');
const { listItemProcess } = require('utilities/waivioApi');
const crypto = require('node:crypto');

const specialUpdater1 = async ({
  field, authorPermlink, app, voter, percent,
}) => {
  await addSearchField({
    authorPermlink, newWords: parseSearchData(field),
  });
};

const specialUpdater2 = async ({
  field, authorPermlink, app, voter, percent,
}) => {
  await addSearchField({
    authorPermlink, newWords: parseSearchData(field),
  });
  await tagsParser.createTags({ authorPermlink, field, app });
};

const specialUpdater3 = async ({
  field, authorPermlink, app, voter, percent,
}) => {
  await processingParent(authorPermlink, app);
};

const specialUpdater4 = async ({
  field, authorPermlink, app, voter, percent,
}) => {
  const { wobjects: wobjTagCloud } = await Wobj.getSomeFields(
    FIELDS_NAMES.TAG_CLOUD,
    authorPermlink,
  );
  const condition1 = _.isArray(_.get(wobjTagCloud, '[0].fields'));
  const condition2 = _.get(wobjTagCloud, '[0].fields[0]');

  if (condition1 && condition2) {
    await Wobj.update(
      { author_permlink: authorPermlink },
      { tagClouds: wobjTagCloud[0].fields.slice(0, TAG_CLOUDS_UPDATE_COUNT) },
    );
  }
};

const specialUpdater5 = async ({
  field, authorPermlink, app, voter, percent,
}) => {
  const { wobjects: wobjRating } = await Wobj.getSomeFields(FIELDS_NAMES.RATING, authorPermlink);
  if (_.isArray(_.get(wobjRating, '[0].fields')) && _.get(wobjRating, '[0].fields[0]')) {
    await Wobj.update(
      { author_permlink: authorPermlink },
      { ratings: wobjRating[0].fields.slice(0, RATINGS_UPDATE_COUNT) },
    );
  }
};

const specialUpdater6 = async ({
  field, authorPermlink, app, voter, percent,
}) => {
  const { wobject } = await Wobj.getOne({ author_permlink: authorPermlink });
  const { map } = await processWobjects({
    wobjects: [wobject], app, fields: [FIELDS_NAMES.MAP], returnArray: false,
  });
  if (map) {
    const parsedMap = parseMap(map);
    if (validateMap(parsedMap)) {
      await Wobj.update(
        { author_permlink: authorPermlink },
        { map: { type: 'Point', coordinates: [parsedMap.longitude, parsedMap.latitude] } },
      );
      await setMapToChildren(authorPermlink, parsedMap);
    }
  }
};

const specialUpdater7 = async ({
  field, authorPermlink, app, voter, percent,
}) => {
  const { wobjects: [{ fields } = {}] } = await Wobj.getSomeFields(
    FIELDS_NAMES.STATUS,
    authorPermlink,
  );

  const status = _.chain(fields)
    .filter((f) => {
      try {
        const parsed = JSON.parse(f);
        return !!parsed.title;
      } catch (e) {
        return false;
      }
    })
    .first()
    .value();

  if (status) {
    field.voter = voter || _.get(field, 'creator', null);
    await restaurantStatus(field, authorPermlink, JSON.parse(status).title);
    await Wobj.update({ author_permlink: authorPermlink }, { status: JSON.parse(status) });
  } else {
    field.voter = voter;
    await restaurantStatus(field, authorPermlink, '');
    await Wobj.update({ author_permlink: authorPermlink }, { $unset: { status: '' } });
  }
  await checkForListItemsCounters(authorPermlink);
};

const specialUpdater8 = async ({
  field, authorPermlink, app, voter, percent,
}) => {
  await addSearchField({
    authorPermlink, newWords: parseSearchData(field),
  });
  await updateTagCategories({ authorPermlink, field });
};

const specialUpdater9 = async ({
  field, authorPermlink, app, voter, percent,
}) => {
  await manageAuthorities({
    voter, field, percent, authorPermlink,
  });
};

const specialUpdater10 = async ({
  field, authorPermlink, app, voter, percent,
}) => {
  await addSearchField({
    authorPermlink, newWords: parseSearchData(field),
  });
  await updateChildrenSingle({ field, authorPermlink });
};

const specialUpdater11 = async ({
  field, authorPermlink, app, voter, percent,
}) => {
  await manageDepartments({
    field,
    authorPermlink,
    app,
    percent,
  });
};

const specialUpdater12 = async ({
  field, authorPermlink, app, voter, percent,
}) => {
  await addSearchField({
    authorPermlink, newWords: parseSearchData(field),
  });
  await updateMetaGroupId({ authorPermlink });
};

const specialUpdater13 = async ({
  field, authorPermlink, app, voter, percent,
}) => {
  listItemProcess.send({ authorPermlink, listItemLink: field.body });
};

const updaterByFieldName = {
  [FIELDS_NAMES.EMAIL]: specialUpdater1,
  [FIELDS_NAMES.PHONE]: specialUpdater1,
  [FIELDS_NAMES.ADDRESS]: specialUpdater1,
  [FIELDS_NAMES.COMPANY_ID]: specialUpdater1,
  [FIELDS_NAMES.PRODUCT_ID]: specialUpdater1,
  [FIELDS_NAMES.BRAND]: specialUpdater1,
  [FIELDS_NAMES.MANUFACTURER]: specialUpdater1,
  [FIELDS_NAMES.MERCHANT]: specialUpdater1,
  [FIELDS_NAMES.RECIPE_INGREDIENTS]: specialUpdater1,
  [FIELDS_NAMES.NAME]: specialUpdater2,
  [FIELDS_NAMES.DESCRIPTION]: specialUpdater2,
  [FIELDS_NAMES.TITLE]: specialUpdater2,
  [FIELDS_NAMES.PARENT]: specialUpdater3,
  [FIELDS_NAMES.TAG_CLOUD]: specialUpdater4,
  [FIELDS_NAMES.RATING]: specialUpdater5,
  [FIELDS_NAMES.MAP]: specialUpdater6,
  [FIELDS_NAMES.STATUS]: specialUpdater7,
  [FIELDS_NAMES.CATEGORY_ITEM]: specialUpdater8,
  [FIELDS_NAMES.AUTHORITY]: specialUpdater9,
  [FIELDS_NAMES.AUTHORS]: specialUpdater10,
  [FIELDS_NAMES.PUBLISHER]: specialUpdater10,
  [FIELDS_NAMES.DEPARTMENTS]: specialUpdater11,
  [FIELDS_NAMES.GROUP_ID]: specialUpdater12,
  [FIELDS_NAMES.LIST_ITEM]: specialUpdater13,
  default: () => {},
};

// "author" and "permlink" it's identity of FIELD which type of need to update
// "author_permlink" it's identity of WOBJECT
const update = async ({
  author, permlink, authorPermlink, voter, percent, metadata,
}) => {
  const { field, error } = await Wobj.getField(author, permlink, authorPermlink);
  const { result: app } = await App.findOne({ host: config.appHost });

  if (error || !field) return;

  const updateHandler = updaterByFieldName[field.name] || updaterByFieldName.default;

  await updateHandler({
    field, authorPermlink, app, voter, percent,
  });

  if (voter && field.creator !== voter && field.weight < 0) {
    if (!_.find(field.active_votes, (vote) => vote.voter === field.creator)) return;
    const voteData = _.find(field.active_votes, (vote) => vote.voter === voter);
    if (!_.get(voteData, 'weight') || voteData.weight > 0 || field.weight - voteData.weight < 0) return;
    await rejectUpdate({
      creator: field.creator,
      voter,
      author_permlink: authorPermlink,
      fieldName: field.name,
    });
  }
};

const checkForListItemsCounters = async (authorPermlink) => {
  const { wobject } = await Wobj.findOne({
    filter: {
      fields: {
        $elemMatch: {
          name: FIELDS_NAMES.LIST_ITEM,
          body: authorPermlink,
        },
      },
    },
    projection: { _id: 1 },
  });
  if (wobject) {
    await listItemProcess.send({ authorPermlink, listItemLink: '' });
  }
};

const manageAuthorities = async ({
  voter, field, percent, authorPermlink,
}) => {
  if (!voter || field.creator === voter) {
    if (percent <= 0) {
      await Wobj.update(
        { author_permlink: authorPermlink },
        { $pull: { [`authority.${field.body}`]: field.creator } },
      );
      await userShopDeselectModel.create({
        authorPermlink,
        userName: field.creator,
      });
    } else if (!_.isNumber(percent) || percent > 0) {
      await Wobj.update(
        { author_permlink: authorPermlink },
        { $addToSet: { [`authority.${field.body}`]: field.creator } },
      );
      await userShopDeselectModel.deleteOne({
        authorPermlink,
        userName: field.creator,
      });
    }
  //  await updateSitesObjects(field.creator);
  }
};

const addToAllMetaGroup = async ({ groupIds, metaGroupId }) => {
  while (true) {
    const { result, error } = await Wobj.findByGroupIds({ groupIds, metaGroupId });
    if (error) break;
    if (_.isEmpty(result)) break;
    for (const resultElement of result) {
      groupIds = _.uniq([...groupIds, ...getObjectGroupIds(resultElement)]);
    }
    await Wobj.updateMany(
      { author_permlink: { $in: _.map(result, 'author_permlink') } },
      { metaGroupId },
    );
  }
};

const getObjectGroupIds = (wobject) => _.chain(wobject.fields)
  .filter((f) => f.name === FIELDS_NAMES.GROUP_ID)
  .map((el) => el.body)
  .value();

const updateMetaGroupId = async ({ authorPermlink }) => {
  const { wobject } = await Wobj.getOne({ author_permlink: authorPermlink });
  if (!wobject) return;
  const metaGroupId = wobject.metaGroupId ? wobject.metaGroupId : crypto.randomUUID();
  const groupIds = getObjectGroupIds(wobject);
  await addToAllMetaGroup({ groupIds, metaGroupId });
};

const removeFromDepartments = async ({
  authorPermlink,
  department,
  relatedNames,
  wobject,
  app,
}) => {
  const processed = await processWobjects({
    wobjects: [wobject], app, fields: [FIELDS_NAMES.DEPARTMENTS], returnArray: false,
  });

  const notRejected = _.find(
    _.get(processed, 'departments'),
    (d) => _.get(d, 'body') === department,
  );
  if (notRejected) return;

  await Wobj.update(
    { author_permlink: authorPermlink },
    { $pull: { departments: department } },
  );

  for (const relatedEl of relatedNames) {
    const { wobject: result } = await Wobj.findOne({
      filter: { departments: { $all: [department, relatedEl] } },
      projection: { _id: 1 },
    });
    if (!result) {
      await Department.updateOne({
        filter: { name: relatedEl },
        update: {
          $pull: { related: department },
        },
      });
      await Department.updateOne({
        filter: { name: department },
        update: {
          $pull: { related: relatedEl },
        },
      });
    }
  }
};

const manageDepartments = async ({
  field, authorPermlink, percent, app,
}) => {
  const { wobject } = await Wobj.getOne({ author_permlink: authorPermlink });
  if (!wobject) return;
  const sameDepartmentFields = _.filter(
    wobject.fields,
    (f) => f.name === FIELDS_NAMES.DEPARTMENTS && f.body === field.body,
  );

  const related = _.filter(
    wobject.fields,
    (f) => f.name === FIELDS_NAMES.DEPARTMENTS && f.body !== field.body,
  );
  const relatedNames = _.map(related, 'body');

  if (percent && percent <= 0) {
    const department = field.body;
    await removeFromDepartments({
      authorPermlink,
      department,
      relatedNames,
      wobject,
      app,
    });
    return;
  }

  const { result, error } = await Department.findOneOrCreateByName({
    name: field.body,
    search: parseName(field.body),
  });
  if (error) return;

  const needUpdateCount = sameDepartmentFields.length === 1;
  const { result: objectsCount } = await Wobj.departmentUniqCount(field.body);

  await Wobj.update(
    { author_permlink: authorPermlink },
    { $addToSet: { departments: result.name } },
  );

  await Department.updateOne({
    filter: { name: field.body },
    update: {
      ...(needUpdateCount && objectsCount && { $set: { objectsCount } }),
      $addToSet: { related: { $each: relatedNames } },
    },
  });

  await Department.updateMany({
    filter: { name: { $in: relatedNames } },
    update: {
      $addToSet: { related: field.body },
    },
  });

  const supposedUpdates = await getTagCategoryToUpdate(wobject.object_type);
  if (_.isEmpty(supposedUpdates)) return;
  const tagFields = _.filter(
    wobject.fields,
    (f) => _.includes(supposedUpdates, f.tagCategory),
  );

  for (const tagField of tagFields) {
    await redisSetter.incrementDepartmentTag({
      categoryName: tagField.tagCategory,
      tag: tagField.body,
      department: field.body,
    });
  }
};

const updateChildrenSingle = async ({ field, authorPermlink }) => {
  const body = jsonHelper.parseJson(field.body, null);
  if (!body) return;
  if (!body.authorPermlink) return;
  return addChildrenToObjects(
    { permlinks: [body.authorPermlink], childrenPermlink: authorPermlink },
  );
};

const addChildrenToObjects = async ({ permlinks, childrenPermlink }) => Wobj.updateMany(
  { author_permlink: { $in: permlinks } },
  { $addToSet: { children: childrenPermlink } },
);

const parseMap = (map) => {
  let parsedMap;
  try {
    parsedMap = JSON.parse(map);
  } catch (mapParseError) {
    console.error(`Error on parse "${FIELDS_NAMES.MAP}" field: ${mapParseError}`);
    return;
  }
  if (parsedMap.latitude && parsedMap.longitude) {
    parsedMap.latitude = Number(parsedMap.latitude);
    parsedMap.longitude = Number(parsedMap.longitude);
  }
  return parsedMap;
};
const updateSitesObjects = async (userName) => {
  const { result } = await App.find({ authority: userName });
  if (!_.get(result, 'length')) return;
  await Promise.all(result.map(async (app) => {
    await siteHelper.updateSupportedObjects({ app, host: app.host });
  }));
};

const processingParent = async (authorPermlink, app) => {
  const { wobject } = await Wobj.getOne({ author_permlink: authorPermlink });
  const processedWobject = await processWobjects({
    wobjects: [{ ...wobject }], app, fields: [FIELDS_NAMES.PARENT], returnArray: false,
  });
  const hasMap = _.find(wobject.fields, (field) => field.name === FIELDS_NAMES.MAP);
  // update data when there is no parent
  const updateData = hasMap ? { parent: '' } : { parent: '', map: null };
  if (!_.get(processedWobject, 'parent')) return Wobj.update({ author_permlink: authorPermlink }, updateData);
  await Wobj.update(
    { author_permlink: authorPermlink },
    { parent: processedWobject.parent },
  );
  if (hasMap) return;
  const { wobject: parent } = await Wobj.getOne({ author_permlink: processedWobject.parent });
  if (!parent) return;
  const { map } = await processWobjects({
    wobjects: [parent], app, fields: [FIELDS_NAMES.MAP], returnArray: false,
  });
  if (map) {
    const parsedMap = parseMap(map);
    if (validateMap(parsedMap)) {
      await Wobj.update(
        { author_permlink: authorPermlink },
        { map: { type: 'Point', coordinates: [parsedMap.longitude, parsedMap.latitude] } },
      );
    }
  }
};

const getTagCategoryToUpdate = async (objectType) => {
  const { objectType: result } = await ObjectType.getOne({ name: objectType });
  const tagCategories = _.find(result.supposed_updates, (u) => u.name === 'tagCategory');

  return _.get(tagCategories, 'values', []);
};

const updateTagCategories = async ({ authorPermlink, field }) => {
  const { wobject } = await Wobj.getOne({ author_permlink: authorPermlink });
  if (!wobject) return;
  const supposedUpdates = await getTagCategoryToUpdate(wobject.object_type);
  if (!_.includes(supposedUpdates, field.tagCategory)) return;

  await redisSetter.incrementTag({
    objectType: wobject.object_type,
    tag: field.body,
    categoryName: field.tagCategory,
  });
  if (_.isEmpty(wobject.departments)) return;
  for (const department of wobject.departments) {
    await redisSetter.incrementDepartmentTag({
      categoryName: field.tagCategory,
      tag: field.body,
      department,
    });
  }
};

const setMapToChildren = async (authorPermlink, map) => {
  const { wobjects: children } = await Wobj
    .getMany({
      condition: { parent: authorPermlink, 'fields.name': { $ne: 'map' } },
      select: 'author_permlink',
    });
  if (!_.isEmpty(children)) {
    await Wobj.updateMany(
      { author_permlink: { $in: _.map(children, 'author_permlink') } },
      { map: { type: 'Point', coordinates: [map.longitude, map.latitude] } },
    );
  }
};

// --------------------------Add search n-grams---------------------------------
const createEdgeNGrams = (str) => {
  const minGram = 3;
  if (str && str.length <= minGram) return str;

  const arrayOfStrings = [];

  for (let i = minGram; i <= str.length; ++i) {
    arrayOfStrings.push(str.substr(0, i));
  }

  return arrayOfStrings.join(' ');
};

const parseName = (rawName = '') => {
  if (!rawName) return;
  if (typeof rawName !== 'string') return;

  return createEdgeNGrams(rawName.trim()
    .replace(/[.,%?+*|{}[\]()<>“”^'"\\\-_=!&$:]/g, '')
    .replace(/  +/g, ' '));
};

const searchFromBody = ({ fieldBody, field }) => [parseName(fieldBody)];

const parseAddress = (addressFromDB) => {
  let rawAddress;
  try {
    rawAddress = JSON.parse(addressFromDB);
  } catch (err) {
    return { err };
  }
  let address = '';
  for (const key in rawAddress) {
    address += `${rawAddress[key]},`;
  }
  const addressWithoutSpaces = address.substr(0, address.length - 1)
    .replace(/^,*/, '')
    .replace(/[,\s]{2,}/, ',');
  const addressesInNgrams = [];
  for (const el of addressWithoutSpaces.split(',')) {
    addressesInNgrams.push(parseName(el));
  }

  return { addresses: addressesInNgrams };
};

const parseBodyProperty = ({ body, propertyName }) => {
  const parsedBody = jsonHelper.parseJson(body, null);
  if (!parsedBody) return;
  const property = _.get(parsedBody, propertyName);
  if (!property) return;
  return parseName(property);
};
const searchPhone = ({ fieldBody, field }) => [createEdgeNGrams(_.get(field, 'number', '')
  .replace(/[.%?+*|{}[\]()<>“”^'"\\\-_=!&$:]+/g, '').split(' ').join('')
  .trim())];

const searchFromAddress = ({ fieldBody, field }) => {
  const { addresses, err } = parseAddress(fieldBody);
  if (err) return [];
  return addresses;
};

const searchFromId = ({ fieldBody, field }) => {
  const parsedBody = jsonHelper.parseJson(fieldBody, null);
  if (!parsedBody) return [];
  const searchData = _.get(parsedBody, 'companyId') || _.get(parsedBody, 'productId');
  if (!searchData) return [];

  return [parseName(searchData)];
};

const searchBodyProperty = ({ fieldBody, field }) => {
  const nameProperty = parseBodyProperty({
    body: fieldBody,
    propertyName: 'name',
  });
  if (nameProperty) return [nameProperty];
  return [];
};

const parseBodyArray = ({ fieldBody, field }) => {
  const parsedBody = jsonHelper.parseJson(fieldBody, null);
  if (!parsedBody?.length) return [];

  return parsedBody.map((el) => parseName(el));
};

const searchDataByField = {
  [FIELDS_NAMES.NAME]: searchFromBody,
  [FIELDS_NAMES.EMAIL]: searchFromBody,
  [FIELDS_NAMES.CATEGORY_ITEM]: searchFromBody,
  [FIELDS_NAMES.GROUP_ID]: searchFromBody,
  [FIELDS_NAMES.TITLE]: searchFromBody,
  [FIELDS_NAMES.DESCRIPTION]: searchFromBody,
  [FIELDS_NAMES.PHONE]: searchPhone,
  [FIELDS_NAMES.ADDRESS]: searchFromAddress,
  [FIELDS_NAMES.COMPANY_ID]: searchFromId,
  [FIELDS_NAMES.PRODUCT_ID]: searchFromId,
  [FIELDS_NAMES.AUTHORS]: searchBodyProperty,
  [FIELDS_NAMES.PUBLISHER]: searchBodyProperty,
  [FIELDS_NAMES.BRAND]: searchBodyProperty,
  [FIELDS_NAMES.MANUFACTURER]: searchBodyProperty,
  [FIELDS_NAMES.MERCHANT]: searchBodyProperty,
  [FIELDS_NAMES.RECIPE_INGREDIENTS]: parseBodyArray,
};

const parseSearchData = (field) => {
  const fieldName = field?.name ?? '';
  const fieldBody = field?.body ?? '';
  if (!_.includes(SEARCH_FIELDS, fieldName)) return;

  const handler = searchDataByField[fieldName] || searchFromBody;

  return handler({ field, fieldBody });
};

const addSearchField = async ({ authorPermlink, newWords }) => {
  if (_.isEmpty(_.compact(newWords))) return { result: false };
  const { result, error } = await Wobj.addSearchFields({
    authorPermlink, newWords,
  });
  if (error) return { error };
  return { result };
};

module.exports = {
  update,
  processingParent,
  parseMap,
  parseSearchData,
  addSearchField,
  parseAddress,
  parseName,
  createEdgeNGrams,
  removeFromDepartments,
};
