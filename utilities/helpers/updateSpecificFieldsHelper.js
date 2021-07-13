const _ = require('lodash');
const config = require('config');
const { Wobj, App } = require('models');
const { tagsParser } = require('utilities/restaurantTagsParser');
const { redisGetter, redisSetter } = require('utilities/redis');
const { processWobjects } = require('utilities/helpers/wobjectHelper');
const { validateMap } = require('validator/specifiedFieldsValidator');
const {
  FIELDS_NAMES, TAG_CLOUDS_UPDATE_COUNT, RATINGS_UPDATE_COUNT, SEARCH_FIELDS,
} = require('constants/wobjectsData');
const { restaurantStatus, rejectUpdate } = require('utilities/notificationsApi/notificationsUtil');
const siteHelper = require('utilities/helpers/sitesHelper');

// "author" and "permlink" it's identity of FIELD which type of need to update
// "author_permlink" it's identity of WOBJECT
const update = async ({
  author, permlink, authorPermlink, voter, percent, metadata,
}) => {
  const { field, error } = await Wobj.getField(author, permlink, authorPermlink);
  const { result: app } = await App.findOne({ host: config.appHost });

  if (error || !field) return;

  switch (field.name) {
    case FIELDS_NAMES.EMAIL:
    case FIELDS_NAMES.PHONE:
    case FIELDS_NAMES.ADDRESS:
      await addSearchField({
        authorPermlink, newWords: parseSearchData(metadata),
      });
      break;
    case FIELDS_NAMES.NAME:
      await addSearchField({
        authorPermlink, newWords: parseSearchData(metadata),
      });
      await tagsParser.createTags({ authorPermlink, field });
      break;
    case FIELDS_NAMES.DESCRIPTION:
    case FIELDS_NAMES.TITLE:
      await tagsParser.createTags({ authorPermlink, field });
      break;
    case FIELDS_NAMES.PARENT:
      await processingParent(authorPermlink, app);
      break;
    case FIELDS_NAMES.TAG_CLOUD:
      const { wobjects: wobjTagCloud } = await Wobj.getSomeFields(
        FIELDS_NAMES.TAG_CLOUD, authorPermlink,
      );
      if (_.isArray(_.get(wobjTagCloud, '[0].fields')) && _.get(wobjTagCloud, '[0].fields[0]')) {
        await Wobj.update(
          { author_permlink: authorPermlink },
          { tagClouds: wobjTagCloud[0].fields.slice(0, TAG_CLOUDS_UPDATE_COUNT) },
        );
      }
      break;
    case FIELDS_NAMES.RATING:
      const { wobjects: wobjRating } = await Wobj.getSomeFields(
        FIELDS_NAMES.RATING, authorPermlink,
      );
      if (_.isArray(_.get(wobjRating, '[0].fields')) && _.get(wobjRating, '[0].fields[0]')) {
        await Wobj.update(
          { author_permlink: authorPermlink },
          { ratings: wobjRating[0].fields.slice(0, RATINGS_UPDATE_COUNT) },
        );
      }
      break;
    case FIELDS_NAMES.MAP:
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
      break;
    case FIELDS_NAMES.STATUS:
      const { wobjects: [{ fields } = {}] } = await Wobj.getSomeFields(
        FIELDS_NAMES.STATUS, authorPermlink,
      );
      const status = _.chain(fields)
        .filter((f) => {
          try {
            const parsed = JSON.parse(f);
            return !!parsed.title;
          } catch (e) {
            return false;
          }
        }).first()
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
      break;
    case FIELDS_NAMES.TAG_CATEGORY:
      await updateTagCategories(authorPermlink);
      break;
    case FIELDS_NAMES.CATEGORY_ITEM:
      await updateTagCategories(authorPermlink);
      break;
    case FIELDS_NAMES.AUTHORITY:
      if (!voter || field.creator === voter) {
        if (percent <= 0) {
          await Wobj.update(
            { author_permlink: authorPermlink },
            { $pull: { [`authority.${field.body}`]: field.creator } },
          );
        } else if (!_.isNumber(percent) || percent > 0) {
          await Wobj.update(
            { author_permlink: authorPermlink },
            { $addToSet: { [`authority.${field.body}`]: field.creator } },
          );
        }
        await updateSitesObjects(field.creator);
      }
      return;
  }
  if (voter && field.creator !== voter && field.weight < 0) {
    if (!_.find(field.active_votes, (vote) => vote.voter === field.creator)) return;
    const voteData = _.find(field.active_votes, (vote) => vote.voter === voter);
    if (!_.get(voteData, 'weight') || voteData.weight > 0 || field.weight - voteData.weight < 0) return;
    await rejectUpdate({
      id: 'rejectUpdate',
      creator: field.creator,
      voter,
      author_permlink: authorPermlink,
      fieldName: field.name,
    });
  }
};

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

const checkExistingTags = async (tagCategories = []) => {
  for (const category of tagCategories) {
    const existingTags = await redisGetter.getTagCategories(`tagCategory:${category.body}`);
    const newTags = _
      .filter(category.categoryItems, (o) => !_.includes(existingTags, o.name) && o.weight > 0);
    if (!newTags.length) continue;
    let tags = [];
    for (const tag of newTags) tags = _.concat(tags, [0, tag.name]);
    await redisSetter.addTagCategory({ categoryName: category.body, tags });
  }
};

const updateTagCategories = async (authorPermlink) => {
  let tagCategories = [];
  const { wobject: tagCategoriesWobj } = await Wobj.getOne({ author_permlink: authorPermlink });
  tagCategories = _.chain(tagCategoriesWobj)
    .get('fields', [])
    .filter((i) => i.name === FIELDS_NAMES.TAG_CATEGORY || i.name === FIELDS_NAMES.CATEGORY_ITEM)
    .groupBy('id')
    // here is array of arrays
    .reduce((result, items) => {
      let category = {};
      for (let i = 0; i < items.length; i++) {
        if (items[i].name === FIELDS_NAMES.TAG_CATEGORY) [category] = items.splice(i, 1);
      }
      result.push({
        ...category,
        categoryItems: [...items.map((i) => ({
          locale: i.locale, name: i.body, weight: i.weight,
        }))],
      });
      return result;
    }, [])
    .value();
  await checkExistingTags(tagCategories);
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

const parseSearchData = (metadata) => {
  const fieldName = _.get(metadata, 'wobj.field.name');
  if (!_.includes(SEARCH_FIELDS, fieldName)) return;
  const searchFields = [];
  switch (fieldName) {
    case FIELDS_NAMES.NAME:
      searchFields.push(...parseName(_.get(metadata, 'wobj.field.body', '')));
      break;
    case FIELDS_NAMES.EMAIL:
      searchFields.push(_.get(metadata, 'wobj.field.body', ''));
      break;
    case FIELDS_NAMES.PHONE:
      searchFields.push(_.get(metadata, 'wobj.field.number', ''));
      break;
    case FIELDS_NAMES.ADDRESS:
      const { addresses, err } = parseAddress(_.get(metadata, 'wobj.field.body', ''));
      if (err) return { err };
      searchFields.push(...addresses);
      break;
  }
  return searchFields;
};

const addSearchField = async ({ authorPermlink, newWords }) => {
  if (_.isEmpty(newWords)) return { result: false };
  const { result, error } = await Wobj.addSearchFields({
    authorPermlink,
    newWords,
  });
  if (error) return { error };
  return { result };
};

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
  const addressWithSpaces = addressWithoutSpaces.replace(/,(?=[^\s])/g, ', ');
  return { addresses: [addressWithoutSpaces, addressWithSpaces] };
};

const parseName = (rawName) => [rawName, rawName.trim().replace(/[.%?+*|{}[\]()<>“”^'"\\\-_=!&$:]/g, '')];

module.exports = {
  update, processingParent, parseMap, parseSearchData, addSearchField, parseAddress, parseName,
};
