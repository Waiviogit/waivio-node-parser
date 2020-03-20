const _ = require('lodash');
const { validateNewsFilter, validateMap } = require('validator/specifiedFieldsValidator');
const { Wobj } = require('models');
const { restaurantStatus } = require('utilities/notificationsApi/notificationsUtil');

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
    case 'parent':
      const { wobjects: wobjParent } = await Wobj.getSomeFields('parent', authorPermlink);

      if (_.isArray(_.get(wobjParent, '[0].fields')) && _.get(wobjParent, '[0].fields[0]')) {
        await Wobj.update({ author_permlink: authorPermlink }, { parent: wobjParent[0].fields[0] });
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
        await restaurantStatus(field, authorPermlink);
        await Wobj.update({ author_permlink: authorPermlink }, { status: JSON.parse(status) });
      } else {
        field.voter = voter;
        await restaurantStatus(field, authorPermlink);
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

module.exports = { update };
