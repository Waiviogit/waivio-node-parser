const _ = require('lodash');
const crypto = require('node:crypto');
const { ObjectType } = require('models');
const { importUpdates } = require('utilities/objectImportServiceApi');
const {
  MIN_PERCENT_TO_SHOW_UPDATE, VOTE_STATUSES, INDEPENDENT_FIELDS,
  ADMIN_ROLES, categorySwitcher, FIELDS_NAMES, ARRAY_FIELDS,
} = require('constants/wobjectsData');
const supposedUpdatesTranslate = require('constants/translations/supposedUpdates');

/**
 * Unique script to fill objects with supposed updates for specified ObjectType.
 * Get list of supposed updates and send its to ImportService for create
 * @param wobject {Object}
 * @param locale {string}
 */
const addSupposedUpdates = async (wobject, locale, metadata) => {
  if (!_.get(wobject, 'object_type')) return;

  const importObject = !!metadata.datafinityObject;
  if (importObject) return;

  const { objectType, error: objTypeError } = await ObjectType.getOne({
    name: wobject.object_type,
  });
  if (objTypeError) return { error: objTypeError };

  const supposedUpdates = _.get(objectType, 'supposed_updates', []);
  if (_.isEmpty(supposedUpdates)) return;
  const importWobjData = _.pick(wobject, ['author_permlink', 'object_type']);
  importWobjData.fields = [];

  supposedUpdates.forEach((update) => {
    _.get(update, 'values', []).forEach((value) => {
      const body = supposedUpdatesTranslate[value][locale] || supposedUpdatesTranslate[value]['en-US'];
      const field = {
        name: update.name,
        body,
        permlink: `${wobject.author_permlink}-${update.name.toLowerCase()}-${randomString(5)}`,
        creator: wobject.creator,
        locale,
      };
      if (update.id_path) field[update.id_path] = crypto.randomUUID();
      importWobjData.fields.push(field);
    });
  });
  await importUpdates.send([importWobjData]);
};

const randomString = (length = 5) => {
  let result = '';
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

const calculateApprovePercent = (field) => {
  if (_.isEmpty(field.active_votes)) return 100;
  if (field.adminVote) return field.adminVote.status === VOTE_STATUSES.APPROVED ? 100 : 0;
  if (field.weight < 0) return 0;

  const rejectsWeight = _.sumBy(field.active_votes, (vote) => {
    if (vote.percent < 0) {
      return -(+vote.weight || -1);
    }
  }) || 0;
  const approvesWeight = _.sumBy(field.active_votes, (vote) => {
    if (vote.percent > 0) {
      return +vote.weight || 1;
    }
  }) || 0;
  if (!rejectsWeight) return 100;
  const percent = _.round((approvesWeight / (approvesWeight + rejectsWeight)) * 100, 3);
  return percent > 0 ? percent : 0;
};

/** We have some types of admins at wobject, in this method we find admin role type */
const getFieldVoteRole = (vote) => {
  let role = ADMIN_ROLES.ADMIN;
  vote.ownership ? role = ADMIN_ROLES.OWNERSHIP : null;
  vote.administrative ? role = ADMIN_ROLES.ADMINISTRATIVE : null;
  vote.owner ? role = ADMIN_ROLES.OWNER : null;
  return role;
};

const addDataToFields = ({
  fields, filter, admins, ownership, administrative, isOwnershipObj, owner,
}) => {
  /** Filter, if we need not all fields */
  if (filter) fields = _.filter(fields, (field) => _.includes(filter, field.name));

  for (const field of fields) {
    let adminVote, administrativeVote, ownershipVote, ownerVote;
    _.map(field.active_votes, (vote) => {
      vote.timestamp = vote._id.getTimestamp().valueOf();
      if (vote.voter === owner) {
        vote.owner = true;
        ownerVote = vote;
      } else if (_.includes(admins, vote.voter)) {
        vote.admin = true;
        vote.timestamp > _.get(adminVote, 'timestamp', 0) ? adminVote = vote : null;
      } else if (_.includes(administrative, vote.voter)) {
        vote.administrative = true;
        vote.timestamp > _.get(administrativeVote, 'timestamp', 0) ? administrativeVote = vote : null;
      } else if (isOwnershipObj && _.includes(ownership, vote.voter)) {
        vote.ownership = true;
        vote.timestamp > _.get(ownershipVote, 'timestamp', 0) ? ownershipVote = vote : null;
      }
    });
    field.createdAt = field._id.getTimestamp().valueOf();
    /** If field includes admin votes fill in it */
    if (ownerVote || adminVote || administrativeVote || ownershipVote) {
      const mainVote = ownerVote || adminVote || ownershipVote || administrativeVote;
      field.adminVote = {
        role: getFieldVoteRole(mainVote),
        status: mainVote.percent > 0 ? VOTE_STATUSES.APPROVED : VOTE_STATUSES.REJECTED,
        name: mainVote.voter,
        timestamp: mainVote.timestamp,
      };
    }
    field.approvePercent = calculateApprovePercent(field);
  }
  return fields;
};

const specialFieldFilter = (idField, allFields, id) => {
  if (!idField.adminVote && idField.weight < 0) return null;
  idField.items = [];
  const filteredItems = _.filter(allFields[categorySwitcher[id]],
    (item) => item.id === idField.id && _.get(item, 'adminVote.status') !== VOTE_STATUSES.REJECTED);

  for (const itemField of filteredItems) {
    if (!idField.adminVote && itemField.weight < 0) continue;
    idField.items.push(itemField);
  }
  return idField;
};

const arrayFieldFilter = ({
  idFields, allFields, filter, id, permlink,
}) => {
  const validFields = [];
  for (const field of idFields) {
    if (_.get(field, 'adminVote.status') === VOTE_STATUSES.REJECTED) continue;
    switch (id) {
      case FIELDS_NAMES.TAG_CATEGORY:
      case FIELDS_NAMES.GALLERY_ALBUM:
        validFields.push(specialFieldFilter(field, allFields, id));
        break;
      case FIELDS_NAMES.RATING:
      case FIELDS_NAMES.PHONE:
      case FIELDS_NAMES.BUTTON:
      case FIELDS_NAMES.GALLERY_ITEM:
      case FIELDS_NAMES.LIST_ITEM:
      case FIELDS_NAMES.DEPARTMENTS:
      case FIELDS_NAMES.AUTHORITY:
        if (_.includes(filter, FIELDS_NAMES.GALLERY_ALBUM)) break;
        if (_.get(field, 'adminVote.status') === VOTE_STATUSES.APPROVED) validFields.push(field);
        else if (field.weight > 0 && field.approvePercent > MIN_PERCENT_TO_SHOW_UPDATE) {
          validFields.push(field);
        }
        break;
      default:
        break;
    }
  }
  const condition = id === FIELDS_NAMES.GALLERY_ITEM
    && _.includes(filter, FIELDS_NAMES.GALLERY_ALBUM)
    && idFields.length && !allFields[FIELDS_NAMES.GALLERY_ALBUM];

  if (id === FIELDS_NAMES.GALLERY_ALBUM || condition) {
    const noAlbumItems = _.filter(allFields[categorySwitcher[id]],
      (item) => item.id === permlink && _.get(item, 'adminVote.status') !== VOTE_STATUSES.REJECTED);
    if (noAlbumItems.length)validFields.push({ items: noAlbumItems, body: 'Photos', id: permlink });
    id = FIELDS_NAMES.GALLERY_ALBUM;
  }
  return { result: _.compact(validFields), id };
};

const filterFieldValidation = (filter, field, locale, ownership) => {
  field.locale === 'auto' ? field.locale = 'en-US' : null;
  let result = _.includes(INDEPENDENT_FIELDS, field.name) || locale === field.locale;
  if (filter) result = result && _.includes(filter, field.name);
  if (ownership) {
    result = result && _.includes(
      [ADMIN_ROLES.OWNERSHIP, ADMIN_ROLES.ADMIN, ADMIN_ROLES.OWNER], _.get(field, 'adminVote.role'),
    );
  }
  return result;
};

const getFieldsToDisplay = (fields, locale, filter, permlink, ownership) => {
  locale = locale === 'auto' ? 'en-US' : locale;
  const winningFields = {};
  const filteredFields = _.filter(fields,
    (field) => filterFieldValidation(filter, field, locale, ownership));
  if (!filteredFields.length) return {};

  const groupedFields = _.groupBy(filteredFields, 'name');
  for (const id of Object.keys(groupedFields)) {
    const approvedFields = _.filter(groupedFields[id],
      (field) => _.get(field, 'adminVote.status') === VOTE_STATUSES.APPROVED);

    if (_.includes(ARRAY_FIELDS, id)) {
      const { result, id: newId } = arrayFieldFilter({
        idFields: groupedFields[id], allFields: groupedFields, filter, id, permlink,
      });
      if (result.length)winningFields[newId] = result;
      continue;
    }

    if (approvedFields.length) {
      const ownerVotes = _.filter(approvedFields,
        (field) => field.adminVote.role === ADMIN_ROLES.OWNER);
      const adminVotes = _.filter(approvedFields,
        (field) => field.adminVote.role === ADMIN_ROLES.ADMIN);
      if (ownerVotes.length) winningFields[id] = _.maxBy(ownerVotes, 'adminVote.timestamp').body;
      else if (adminVotes.length) winningFields[id] = _.maxBy(adminVotes, 'adminVote.timestamp').body;
      else winningFields[id] = _.maxBy(approvedFields, 'adminVote.timestamp').body;
      continue;
    }
    const heaviestField = _.maxBy(groupedFields[id], (field) => {
      if (_.get(field, 'adminVote.status') !== 'rejected' && field.weight > 0
        && field.approvePercent > MIN_PERCENT_TO_SHOW_UPDATE) return field.weight;
    });
    if (heaviestField) winningFields[id] = heaviestField.body;
  }
  return winningFields;
};

/** Parse wobjects to get its winning */
const processWobjects = async ({
  wobjects, fields, locale = 'en-US',
  app, returnArray = true,
}) => {
  const filteredWobj = [];
  if (!_.isArray(wobjects)) return filteredWobj;
  const admins = _.get(app, 'admins', []);

  for (let obj of wobjects) {
    const exposedFields = [];
    obj.parent = '';
    if (obj.newsFilter) obj = _.omit(obj, ['newsFilter']);
    /** Get app admins, wobj administrators, which was approved by app owner(creator) */
    const ownership = _.intersection(
      _.get(obj, 'authority.ownership', []), _.get(app, 'authority', []),
    );
    const administrative = _.intersection(
      _.get(obj, 'authority.administrative', []), _.get(app, 'authority', []),
    );

    obj.fields = addDataToFields({
      isOwnershipObj: !!ownership.length,
      fields: _.compact(obj.fields),
      filter: fields,
      admins,
      ownership,
      administrative,
      owner: _.get(app, 'owner'),
    });
    /** Omit map, because wobject has field map, temp solution? maybe field map in wobj not need */
    obj = _.omit(obj, ['map']);
    Object.assign(obj,
      getFieldsToDisplay(obj.fields, locale, fields, obj.author_permlink, !!ownership.length));
    obj.exposedFields = exposedFields;
    obj = _.omit(obj, ['fields', 'latest_posts', 'last_posts_counts_by_hours', 'tagCategories', 'children']);
    filteredWobj.push(obj);
  }
  if (!returnArray) return filteredWobj[0];
  return filteredWobj;
};

module.exports = { randomString, addSupposedUpdates, processWobjects };
