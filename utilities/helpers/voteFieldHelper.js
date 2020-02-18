const _ = require('lodash');
const { Wobj, User } = require('models');
const appHelper = require('utilities/helpers/appHelper');
const updateSpecificFieldsHelper = require('utilities/helpers/updateSpecificFieldsHelper');
const userHelper = require('utilities/helpers/userHelper');
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
    data.author, data.permlink, data.author_permlink,
  );

  if (fieldError) return { error: fieldError };
  if (!field) return { error: { status: 404, message: 'Field not found!' } };

  if (_.get(field, 'active_votes')) {
    data.existingVote = field.active_votes.find((v) => v.voter === data.voter);
  }
  data.creator = field.creator;
  await userHelper.checkAndCreateUser(field.creator);
  await unVoteOnAppend(data);
  const { users } = await appHelper.getBlackListUsers();
  if (users && data.percent > 0 && !users.includes(data.voter)) {
    await addVoteOnField(data);
  }
  await handleSpecifiedField(data.author, data.permlink, data.author_permlink);
};

// data includes:
// author, permlink, author_permlink, weight, creator,
// existingVote:{voter, rshares_weight, weight, percent}
const unVoteOnAppend = async (data) => {
  const { existingVote } = data;
  if (existingVote && existingVote.percent && existingVote.rshares_weight && existingVote.weight) {
    await upDownVoteOnAppend({
      ...data,
      weight: -existingVote.weight,
      percent: existingVote.percent,
      rshares_weight: -existingVote.rshares_weight,
    });
  }
  await Wobj.removeVote(data);
};

// data includes:
// author, permlink, author_permlink, weight, creator,
// existingVote:{voter, rshares_weight, weight, percent}
const addVoteOnField = async (data) => {
  data.percent = calculateVotePercent(data.percent);
  data.weight = (data.weight + data.rshares_weight * 0.25) * (data.percent / 100);
  await upDownVoteOnAppend({ ...data });

  await Wobj.addVote({
    ...data,
    vote: {
      voter: data.voter,
      percent: data.percent,
      rshares_weight: data.rshares_weight,
      weight: data.weight,
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
 * @param voter {String} Person who vote for field(Approve or Reject)
 * @returns {Promise<void>}
 */
const upDownVoteOnAppend = async ({
  author, permlink, author_permlink: authorPermlink, weight,
  creator, voter, rshares_weight: rsharesWeight, percent,
}) => {
  if (percent > 0) {
  // increase weight of voter only on UpVotes

    await User.increaseWobjectWeight({
      name: voter,
      author_permlink: authorPermlink,
      weight: rsharesWeight * 0.25 * (percent / 100),
    });
  }
  // increase weight of field author
  await User.increaseWobjectWeight({
    name: creator,
    author_permlink: authorPermlink,
    weight: rsharesWeight * 0.75 * (percent / 100),
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
 * @returns {Number} Number from 1 to 100
 */
const calculateVotePercent = (percent) => {
  if (percent % 10 === 0) return _.round((percent / 100), 1);
  return -_.round((percent / 100), 1);
};

const handleSpecifiedField = async (author, permlink, authorPermlink) => {
  const { field, error } = await Wobj.getField(author, permlink, authorPermlink);

  if (error || !field) return;
  await updateSpecificFieldsHelper.update(author, permlink, authorPermlink);
};

module.exports = { voteOnField };
