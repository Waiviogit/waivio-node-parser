const _ = require('lodash');
const { Wobj } = require('models');
const { wobjectValidator } = require('validator');

const parse = async (operation) => {
  let json;

  try {
    json = JSON.parse(operation.json);
  } catch (err) {
    console.error(err);
    return;
  }
  if (!wobjectValidator.validateRatingVote(json, operation)) {
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

module.exports = { parse };
