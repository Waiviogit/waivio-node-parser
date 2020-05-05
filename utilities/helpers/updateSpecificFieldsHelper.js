const _ = require('lodash');
const { validateNewsFilter, validateMap } = require('validator/specifiedFieldsValidator');
const { Wobj } = require('models');
const { restaurantStatus, custom } = require('utilities/notificationsApi/notificationsUtil');
const { tagsParser } = require('utilities/restaurantTagsParser');


const TAG_CLOUDS_UPDATE_COUNT = 5;
const RATINGS_UPDATE_COUNT = 4;

// "author" and "permlink" it's identity of FIELD which type of need to update
// "author_permlink" it's identity of WOBJECT
const update = async (author, permlink, authorPermlink, voter) => {
  const { field, error } = await Wobj.getField(author, permlink, authorPermlink);

  if (error || !field) {
    return;
  }
  switch (field.name) {
    case 'name':
    case 'description':
    case 'title':
      await tagsParser.createTags({ authorPermlink, field });
      break;
    case 'parent':
      const { wobjects: wobjParent } = await Wobj.getSomeFields('parent', authorPermlink);

      if (_.isArray(_.get(wobjParent, '[0].fields')) && _.get(wobjParent, '[0].fields[0]')) {
        await Wobj.update({ author_permlink: authorPermlink }, { parent: wobjParent[0].fields[0] });
        await updateMapFromParent(authorPermlink, wobjParent[0].fields[0]);
      }
      break;

    case 'tagCloud':
      const { wobjects: wobjTagCloud } = await Wobj.getSomeFields('tagCloud', authorPermlink);
      if (_.isArray(_.get(wobjTagCloud, '[0].fields')) && _.get(wobjTagCloud, '[0].fields[0]')) {
        await Wobj.update(
          { author_permlink: authorPermlink },
          { tagClouds: wobjTagCloud[0].fields.slice(0, TAG_CLOUDS_UPDATE_COUNT) },
        );
      }
      break;

    case 'rating':
      const { wobjects: wobjRating } = await Wobj.getSomeFields('rating', authorPermlink);
      if (_.isArray(_.get(wobjRating, '[0].fields')) && _.get(wobjRating, '[0].fields[0]')) {
        await Wobj.update(
          { author_permlink: authorPermlink },
          { ratings: wobjRating[0].fields.slice(0, RATINGS_UPDATE_COUNT) },
        );
      }
      break;

    case 'newsFilter':
      const { wobjects: wobjNewsFilter } = await Wobj.getSomeFields('newsFilter', authorPermlink);
      if (_.isArray(_.get(wobjNewsFilter, '[0].fields')) && _.get(wobjNewsFilter, '[0].fields[0]')) {
        let newsFilter;

        try {
          newsFilter = JSON.parse(wobjNewsFilter[0].fields[0]);
        } catch (newsFilterParseError) {
          console.error(`Error on parse "newsFilter" field: ${newsFilterParseError}`);
          break;
        }
        if (validateNewsFilter(newsFilter)) {
          await Wobj.update({ author_permlink: authorPermlink }, { newsFilter });
        }
      }
      break;

    case 'map':
      const { wobjects: wobjMap } = await Wobj.getSomeFields('map', authorPermlink);
      if (_.isArray(_.get(wobjMap, '[0].fields')) && _.get(wobjMap, '[0].fields[0]')) {
        let map;
        try {
          map = JSON.parse(wobjMap[0].fields[0]);
        } catch (mapParseError) {
          console.error(`Error on parse "map" field: ${mapParseError}`);
          break;
        }
        if (map.latitude && map.longitude) {
          map.latitude = Number(map.latitude);
          map.longitude = Number(map.longitude);
        }
        if (validateMap(map)) {
          await Wobj.update(
            { author_permlink: authorPermlink },
            { map: { type: 'Point', coordinates: [map.longitude, map.latitude] } },
          );
          await updateMapForAllChildren({ parentPermlink: authorPermlink, map });
        }
      }
      break;

    case 'status':
      const { wobjects: [{ fields } = {}] } = await Wobj.getSomeFields('status', authorPermlink);
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

    case 'tagCategory':
      await updateTagCategories(authorPermlink);
      break;

    case 'categoryItem':
      await updateTagCategories(authorPermlink);
      break;
  }

  if (voter && field.creator !== voter && field.weight < 0) {
    if (!_.find(field.active_votes, (vote) => vote.voter === field.creator)) return;
    const voteData = _.find(field.active_votes, (vote) => vote.voter === voter);
    if (voteData.weight > 0 || field.weight - voteData.weight < 0) return;
    await custom({
      id: 'rejectUpdate', creator: field.creator, voter, author_permlink: authorPermlink, fieldName: field.name,
    });
  }
};

const updateTagCategories = async (authorPermlink) => {
  let tagCategories = [];
  const { wobject: tagCategoriesWobj } = await Wobj.getOne({ author_permlink: authorPermlink });
  tagCategories = _.chain(tagCategoriesWobj)
    .get('fields', [])
    .filter((i) => i.name === 'tagCategory' || i.name === 'categoryItem')
    .groupBy('id')
  // here is array of arrays
    .reduce((result, items) => {
      let category = {};
      for (let i = 0; i < items.length; i++) {
        if (items[i].name === 'tagCategory') [category] = items.splice(i, 1);
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
  await Wobj.update({ author_permlink: authorPermlink }, { tagCategories });
};

// use on "parent" update
const updateMapFromParent = async (authorPermlink, parentPermlink) => {
  const { wobject, error } = await Wobj.getOne({ author_permlink: authorPermlink });
  if (error) return { error };
  if (!wobject.map) {
    const parentRes = await Wobj.getOne({ author_permlink: parentPermlink });
    if (_.get(parentRes, 'wobject.map')) {
      return Wobj.update({ author_permlink: authorPermlink }, { map: parentRes.wobject.map });
    }
  }
};

// use on "map" update
const updateMapForAllChildren = async ({ parentPermlink, map }) => {
  const { wobjects: childWobjects, error } = await Wobj.getMany({
    condition: { parent: parentPermlink },
    select: '-_id author_permlink fields',
  });

  if (error) return { error };

  const childPermlinks = _
    .chain(childWobjects)
    .filter((w) => !w.fields.map((f) => f.name).includes('map'))
    .map((w) => w.author_permlink)
    .value();

  return Wobj.updateMany({ author_permlink: { $in: childPermlinks } }, map);
};

module.exports = { update };
