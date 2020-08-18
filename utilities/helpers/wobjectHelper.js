const _ = require('lodash');
const config = require('config');
const { uuid } = require('uuidv4');
const { Wobj, App } = require('models');
const { ObjectType } = require('models');
const { importUpdates } = require('utilities/objectImportServiceApi');

const DEFAULT_UPDATES_CREATOR = 'monterey';

/**
 * Unique script to fill objects with supposed updates for specified ObjectType.
 * Get list of supposed updates and send its to ImportService for create
 * @param wobject {Object}
 */
const addSupposedUpdates = async (wobject) => {
  if (!_.get(wobject, 'object_type')) return;
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
      const field = {
        name: update.name,
        body: value,
        permlink: `${wobject.author_permlink}-${update.name.toLowerCase()}-${randomString(5)}`,
        creator: DEFAULT_UPDATES_CREATOR,
      };
      if (update.id_path) field[update.id_path] = uuid();
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

const getWobjWinField = async ({ fieldName, authorPermlink }) => {
  const { app: { admins = [] } } = await App.getOne({ name: config.app });
  const { wobjects: [{ fields } = {}] } = await Wobj.getSomeFields(
    fieldName, authorPermlink, true,
  );

  const voteArr = [];
  _.map(fields, (field) => {
    const adminVotes = [];
    _.map(field.active_votes, (vote) => {
      if (_.includes(admins, vote.voter)) {
        adminVotes.push(vote);
        vote.timestamp = vote._id.getTimestamp().valueOf();
      }
    });
    if (adminVotes.length) {
      const lastVote = _.maxBy(adminVotes, 'timestamp');
      lastVote.percent > 0 ? voteArr.push(field) : null;
      field.adminVote = lastVote.timestamp;
    }
    if (!adminVotes.length) {
      field.weight > 0 ? voteArr.push(field) : null;
    }
  });
  if (!voteArr.length) return false;
  const latestApprove = _.maxBy(voteArr, 'adminVote');
  if (latestApprove) return latestApprove;
  return _.maxBy(voteArr, 'weight');
};

module.exports = { randomString, addSupposedUpdates, getWobjWinField };
