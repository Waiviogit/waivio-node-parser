const _ = require('lodash');
const { Wobj } = require('models');
const wobjectValidator = require('validator/wobjectValidator');
const { validateProxyBot } = require('utilities/guestOperations/guestHelpers');

const parse = async (operation) => {
  const json = parseJson(operation.json);
  if (_.isEmpty(json)) return;
  if (!await wobjectValidator.validateRatingVote(json, operation)) {
    console.error('Rating vote data is not valid!');
    return;
  }
  const voter = operation.required_posting_auths[0];
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
  if (await validateProxyBot(_.get(operation, 'required_posting_auths[0]', _.get(operation, 'required_auths[0]')))) {
    const json = parseJson(operation.json);
    if (_.isEmpty(json)) return;

    operation.required_posting_auths = [_.get(json, 'guestName')];

    await parse(operation);
  }
};

const parseJson = (json) => {
  try {
    return JSON.parse(json);
  } catch (error) {
    return {};
  }
};

module.exports = { parse, parseGuest };
