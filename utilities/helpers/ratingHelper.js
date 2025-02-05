const _ = require('lodash');
const { Wobj } = require('models');
const config = require('config');
const jsonHelper = require('utilities/helpers/jsonHelper');
const wobjectValidator = require('validator/wobjectValidator');
const customJsonHelper = require('utilities/helpers/customJsonHelper');
const { verifySignature } = require('utilities/helpers/signatureHelper');
const { VERIFY_SIGNATURE_TYPE } = require('constants/parsersData');

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

  // find admin vote if exist and not master account voter don't update average_rating_weight
  // if current vote is admin vote average_rating_weight to === rate
  const isMasterAccount = config.masterAccounts.includes(voter);
  const existMasterVote = ratingVotes
    .some(({ voter: voteVoter }) => config.masterAccounts.includes(voteVoter));
  const dontUpdateAverage = !isMasterAccount && existMasterVote;
  if (dontUpdateAverage) return;
  const averageRating = isMasterAccount ? rate : _.meanBy(ratingVotes, 'rate');

  await Wobj.updateField(author, permlink, authorPermlink, 'average_rating_weight', averageRating);
};

const parseGuest = async (operation) => {
  const validSignature = await verifySignature({
    operation, type: VERIFY_SIGNATURE_TYPE.CUSTOM_JSON,
  });
  if (!validSignature) return;

  const json = jsonHelper.parseJson(operation.json);
  if (_.isEmpty(json)) return;

  operation.required_posting_auths = [_.get(json, 'guestName')];

  await parse(operation);
};

module.exports = { parse, parseGuest };
