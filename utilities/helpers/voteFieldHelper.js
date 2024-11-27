const _ = require('lodash');
const { Wobj, User } = require('models');
const appHelper = require('utilities/helpers/appHelper');
const updateSpecificFieldsHelper = require('utilities/helpers/updateSpecificFieldsHelper');
const userHelper = require('utilities/helpers/userHelper');
const { FIELDS_NAMES } = require('constants/wobjectsData');
const { fieldUpdateNotification } = require('utilities/notificationsApi/notificationsUtil');
/**
 * Handle votes on append objects(Fields).
 * DownVotes do not use in app(only "UnVote" if vote already exist)
 * UpVotes depends on integrity of value,
 * if the value is integer(100 00, 40 00, 12 00 etc.) calculate as "UpVote",
 * if the value is not integer (90 40, 10 99 etc.) calculate as "DownVote"
 * @param {Object} data include info about vote and append (field)
 * (author, permlink, author_permlink, voter, percent, weight, rshares_weight)
 * @returns return nothing (or error)
 */
const voteOnField = async (data) => {
  const { field, error: fieldError } = await Wobj.getField(
    data.author,
    data.permlink,
    data.author_permlink,
  );

  if (fieldError) return { error: fieldError };
  if (!field) return { error: { status: 404, message: 'Field not found!' } };
  const valid = specificFieldChecker({ field, vote: data });
  if (!valid) return { error: new Error('voteOnField validation failed') };

  if (_.get(field, 'active_votes')) {
    data.existingVote = field.active_votes.find((v) => v.voter === data.voter);
  }
  data.creator = field.creator;
  await userHelper.checkAndCreateUser(field.creator);
  await unVoteOnAppend(data);
  const { users = [] } = await appHelper.getBlackListUsers();
  if (!users.includes(data.voter)) {
    await addVoteOnField(data, field);
    // inside addVoteOnField percent mutate
    const reject = data.percent < 0;
    if (reject) {
      await fieldUpdateNotification({
        authorPermlink: data.author_permlink,
        field,
        reject,
        initiator: data.voter,
      });
    }
  }
  await handleSpecifiedField(
    data.author,
    data.permlink,
    data.author_permlink,
    data.voter,
    data.percent,
  );
};

// data includes:
// author, permlink, author_permlink, weight, creator,
// existingVote:{voter, rshares_weight, weight, percent}
const unVoteOnAppend = async (data) => {
  const { existingVote } = data;
  if (existingVote && existingVote.percent && existingVote.weight) {
    await upDownVoteOnAppend({
      ...data,
      weight: -(existingVote.weight + 1),
      percent: existingVote.percent,
      rshares_weight: -existingVote.rshares_weight || 0,
    });
  }
  // await Wobj.removeVote(data);
};

// data includes:
// author, permlink, author_permlink, weight, creator,
// existingVote:{voter, rshares_weight, weight, percent}
const addVoteOnField = async (data, field) => {
  // fix to const to show proper percent on front
  const percent = (data.percent % 2 === 0) ? data.percent : -data.percent;

  data.percent = calculateVotePercent(data.percent);
  data.weight = (data.weight + data.expertiseUSD * 0.5) * (data.percent / 100);
  await upDownVoteOnAppend({
    ...data,
  });
  ///
  await Wobj.addVote({
    ...data,
    field,
    vote: {
      voter: data.voter,
      percent,
      rshares_weight: data.rshares_weight,
      weight: data.weight,
      block: data.blockNum,
    },
  });
};

/**
 * Increase weight of field, voter and author of field.
 * Use as UpVote on field and as DownVote on field(depends on rshares and weight value)
 * Rshares weight, wobject weight and percent need to be calculated before, separately
 * @param author Author of field(bot name, who write down comment to blockchain)
 * @param permlink {String} Permlink of comment with "Field"
 * @param author_permlink {String} ID of root wobject
 * @param weight {Number} Voter current weight in current wobject
 * @param rshares_weight {Number} Rshares of current Vote
 * @param percent {Number} Voter Percent of current Vote
 * @param creator {String} Person who create field
 * (not to be confused with bot who write down comment to blockchain)
 * @returns {Promise<void>}
 */
const upDownVoteOnAppend = async ({
  author, permlink, author_permlink: authorPermlink, weight,
  creator, expertiseUSD,
}) => {
  // increase weight of field author
  await User.increaseWobjectWeight({
    name: creator,
    author_permlink: authorPermlink,
    weight: expertiseUSD * 0.5,
  });
  // increase weight of field
  await Wobj.increaseFieldWeight({
    author, permlink, author_permlink: authorPermlink, weight,
  });
};

/**
 * Get real percent of vote on field and return virtual percent inside app waivio,
 * in usual format (for ex: 55.5).
 * @param {Number} percent Number from 1 to 10000
 * @returns {Number} Number from -100 to 100
 */
const calculateVotePercent = (percent) => {
  if (percent % 2 === 0) return (percent / 100);
  return -(percent / 100);
};

const handleSpecifiedField = async (author, permlink, authorPermlink, voter, percent) => {
  const { field, error } = await Wobj.getField(author, permlink, authorPermlink);

  if (error || !field) return;
  await updateSpecificFieldsHelper.update({
    author, permlink, authorPermlink, voter, percent,
  });
};

/**
 * @param field {{name: String, creator: String}}
 * @param vote {{ voter: String}}
 * @returns {Boolean}
 */
const specificFieldChecker = ({ field, vote }) => {
  switch (field.name) {
    case FIELDS_NAMES.AUTHORITY:
      return field.creator === vote.voter;
    default:
      return true;
  }
};

module.exports = { voteOnField };
