const _ = require('lodash');
const { Wobj } = require('models');
const jsonHelper = require('utilities/helpers/jsonHelper');
const wobjectValidator = require('validator/wobjectValidator');
const customJsonHelper = require('utilities/helpers/customJsonHelper');

const parse = async (operation) => {
  const json = jsonHelper.parseJson(operation.json);
  if (_.isEmpty(json)) return;
  if (!await wobjectValidator.validateRatingVote(json, operation)) {
    console.error('Rating vote data is not valid!');
    return;
  }
  const voter = customJsonHelper.getTransactionAccount(operation);
  const { author } = json;
  const { permlink } = json;
  const { author_permlink: authorPermlink } = json;
  const { rate } = json;

  const { field, error } = await Wobj.getField(author, permlink, authorPermlink);

  if (error || !field || field.name !== 'rating') return;
  const ratingVotes = field.rating_votes || [];
  // remove existing vote for current user and push new (replace vote)
  _.remove(ratingVotes, (v) => v.voter === voter);
  ratingVotes.push({ voter, rate });
  await Wobj.updateField(author, permlink, authorPermlink, 'rating_votes', ratingVotes);
  await Wobj.updateField(author, permlink, authorPermlink, 'average_rating_weight', _.meanBy(ratingVotes, 'rate'));
};

const parseGuest = async (operation) => {
  const json = jsonHelper.parseJson(operation.json);
  if (_.isEmpty(json)) return;

  operation.required_posting_auths = [_.get(json, 'guestName')];

  await parse(operation);
};

module.exports = { parse, parseGuest };
