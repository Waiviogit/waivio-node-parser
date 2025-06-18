const _ = require('lodash');
const { usersUtil } = require('utilities/steemApi');
const { User, Post, Wobj } = require('models');
const { votePostHelper } = require('utilities/helpers');
const { commentRefGetter } = require('utilities/commentRefService');
const { jsonVoteValidator } = require('validator');
const {
  VOTE_TYPES, REDIS_KEYS,
} = require('constants/parsersData');
const { ERROR } = require('constants/common');
const notificationsUtil = require('utilities/notificationsApi/notificationsUtil');
const jsonHelper = require('utilities/helpers/jsonHelper');
const redisSetter = require('utilities/redis/redisSetter');
const { updateThreadVoteCount } = require('utilities/helpers/thredsHelper');
const customJsonHelper = require('utilities/helpers/customJsonHelper');
const moment = require('moment/moment');
const rewardHelper = require('../utilities/helpers/rewardHelper');
const appHelper = require('../utilities/helpers/appHelper');
const sentryHelper = require('../utilities/helpers/sentryHelper');
const { fieldUpdateNotification } = require('../utilities/notificationsApi/notificationsUtil');
const { handleSpecifiedField } = require('../utilities/helpers/voteFieldHelper');
const { FIELDS_NAMES } = require('../constants/wobjectsData');

const parse = async (votes, blockNum) => {
  if (_.isEmpty(votes)) return console.log('Parsed votes: 0');
  await updateThreadVoteCount(votes);
  const { votesOps } = await votesFormat(votes);

  const posts = await Post.getPostsByVotes(votesOps);
  const postsWithNewVotes = await usersUtil.calculateVotePower({ votesOps, posts });

  await voteOnObjectFields(votesOps);

  await Promise.all(votesOps.map((voteOp) => parseVoteByType(voteOp, postsWithNewVotes, blockNum)));
  await Promise.all(posts.map((post) => votePostHelper.updateVotesOnPost({ post })));

  await sendLikeNotification(votesOps);
  console.log(`Parsed votes: ${votesOps.length}`);
};

const voteOnObjectFields = async (votes = []) => {
  const updates = votes.filter((v) => v.type === VOTE_TYPES.APPEND_WOBJ);
  if (!updates.length) return;

  const txIds = votes.map((v) => v.transaction_id);
  const { users: blacklistUsers = [] } = await appHelper.getBlackListUsers();
  const shouldProcessVote = (vote, field) => {
    if (field.name === FIELDS_NAMES.AUTHORITY && field.creator !== vote.voter) return false;
    return !blacklistUsers.includes(vote.voter) && vote.percent > 0;
  };
  const getLastVotesByVoter = (votesArr, field) => {
    const lastVoteByVoter = new Map();
    for (const v of votesArr) {
      if (!shouldProcessVote(v, field)) continue;
      lastVoteByVoter.set(v.voter, v);
    }
    return Array.from(lastVoteByVoter.values());
  };

  const processRootWobjGroup = async (rootWobj, groupVotes) => {
    const updateData = {};
    const arrayFilters = [];
    const specificFieldsProcessData = [];
    const votesByObj = groupVotes.map((el) => ({
      ...el,
      groupKey: `${el.author}_${el.permlink}`,
    }));
    const groupedByField = _.groupBy(votesByObj, 'groupKey');

    for (const groupKey of Object.keys(groupedByField)) {
      const [author, permlink] = groupKey.split('_');
      const { field } = await Wobj.getField(author, permlink, rootWobj);
      if (!field) continue;

      const updatesOnField = groupedByField[groupKey];
      const voters = updatesOnField.map((v) => v.voter);

      // Only keep the last vote per voter
      // if length 0 it could be 0 vote - remove vote
      const lastVotes = getLastVotesByVoter(updatesOnField, field);

      // Process votes in parallel
      const processedVotes = await Promise.all(
        lastVotes.map(addWeightAndExpertiseOnVote),
      );

      // Remove old votes from same voters
      const filteredVotes = field.active_votes.filter((v) => !voters.includes(v.voter));
      // Add new votes
      const newVotes = [
        ...filteredVotes,
        ...processedVotes,
      ].map((v) => ({
        voter: v.voter,
        percent: v.percent,
        rshares_weight: v.rshares_weight,
        weight: v.weight,
        weightWAIV: v.weightWAIV,
      }));

      const fieldWeight = newVotes.reduce((acc, el) => acc + el.weight, 0);
      const expertiseUSD = processedVotes.reduce(
        (acc, el) => acc + el.expertiseUSD,
        0,
      );

      const nameForArrayFilter = formatFieldName(permlink);

      updateData[`fields.$[${nameForArrayFilter}].weight`] = fieldWeight;
      updateData[`fields.$[${nameForArrayFilter}].active_votes`] = newVotes;
      arrayFilters.push({ [`${nameForArrayFilter}.permlink`]: permlink });

      // Update user expertise
      await User.increaseWobjectWeight({
        name: field.creator,
        author_permlink: rootWobj,
        weight: expertiseUSD * 0.5,
      });

      // Prepare for post-processing
      for (const processedVote of processedVotes) {
        specificFieldsProcessData.push([
          processedVote.author,
          processedVote.permlink,
          rootWobj,
          processedVote.voter,
          processedVote.percent,
        ]);
        if (processedVote.percent < 0) {
          await fieldUpdateNotification({
            authorPermlink: rootWobj,
            field,
            reject: true,
            initiator: processedVote.voter,
          });
        }
      }
    }

    // Update DB for this object
    const { error: updateError } = await Wobj.updateOneWithArrayFilters({
      authorPermlink: rootWobj,
      updateData,
      arrayFilters,
    });
    if (updateError) {
      await sentryHelper.captureException(updateError.message);
      return;
    }

    // Post-processing for each field
    for (const args of specificFieldsProcessData) {
      await handleSpecifiedField(...args);
    }
  };

  // Group by root_wobj and process all groups in parallel
  const groupedByObject = _.groupBy(updates, 'root_wobj');
  await Promise.all(
    Object.entries(groupedByObject)
      .map(([rootWobj, groupVotes]) => processRootWobjGroup(rootWobj, groupVotes)),
  );

  // Publish all txIds in parallel
  await Promise.all(
    txIds.map((txId) => redisSetter.publishToChannel({
      channel: REDIS_KEYS.TX_ID_MAIN,
      msg: txId,
    })),
  );
};

const formatFieldName = (str) => {
  // Remove all characters that are not a-z, 0-9 (alphanumeric)
  let cleaned = str.replace(/[^a-z0-9]/gi, '');
  // Ensure first character is a lowercase letter
  if (!/^[a-z]/.test(cleaned)) {
    cleaned = `a${cleaned}`; // prepend 'a' if first char is not a lowercase letter
  }
  // Make sure all letters are lowercase
  cleaned = cleaned.toLowerCase();
  return cleaned;
};

const getVoteRsharesForUpdate = async (vote) => {
  let { rshares } = vote;
  if (rshares === 1 && !vote.voter.includes('_')) {
    // calc rshares after week
    rshares = await calcAppendRshares({ vote });
  }

  if (!rshares) rshares = _.get(vote, 'rshares', 1);
  return rshares;
};

const addWeightAndExpertiseOnVote = async (vote) => {
  const { weight } = await User.checkForObjectShares({
    name: vote.voter,
    author_permlink: vote.root_wobj,
  });

  const overallExpertise = await rewardHelper.getWeightForFieldUpdate(weight);
  const rshares = await getVoteRsharesForUpdate(vote);
  const rsharesWeight = Math.round(Number(rshares) * 1e-6);
  const expertiseUSD = await rewardHelper.getUSDFromRshares(rshares);
  const percent = (vote.percent % 2 === 0) ? vote.percent : -vote.percent;

  const updateWeight = Number((overallExpertise + (rsharesWeight * 0.5))
    * (percent / 10000).toFixed(8));

  return {
    ...vote,
    expertiseUSD,
    rshares_weight: rsharesWeight,
    weight: updateWeight,
  };
};

const sendLikeNotification = async (votes) => {
  const likes = _.filter(
    votes,
    (v) => v.type === VOTE_TYPES.POST_WITH_WOBJ && v.rshares >= 0,
  );

  await notificationsUtil.custom({ id: 'like', likes });
};

const parseVoteByType = async (voteOp, posts, blockNum) => {
  if (voteOp.type === VOTE_TYPES.POST_WITH_WOBJ) {
    const post = posts.find((p) => (p.author === voteOp.author || p.author === voteOp.guest_author)
      && p.permlink === voteOp.permlink);
    if (!post) return;
    const createdOverAWeek = moment()
      .diff(moment(_.get(post, 'createdAt')), 'day') > 7;
    if (createdOverAWeek) return;

    await votePostHelper.voteOnPost({
      author: voteOp.author, // author and permlink - identity of field
      permlink: voteOp.permlink,
      voter: voteOp.voter,
      percent: voteOp.weight, // in blockchain "weight" is "percent" of current vote
      wobjects: voteOp.wobjects,
      guest_author: voteOp.guest_author,
      post,
    });
  }
};

const calcAppendRshares = async ({ vote }) => {
  const { user: account } = await usersUtil.getUser(vote.voter);
  if (!account) return 1;

  const voteWeight = vote.weight / 100;
  const decreasedPercent = ((voteWeight * 2) / 100);
  // here we find out what was the votingPower before vote
  const votingPower = vote.json
    ? account.voting_power
    : (100 * account.voting_power) / (100 - decreasedPercent);

  const vests = parseFloat(account.vesting_shares)
    + parseFloat(account.received_vesting_shares) - parseFloat(account.delegated_vesting_shares);

  const accountVotingPower = Math.min(10000, votingPower);

  const power = (((accountVotingPower / 100) * voteWeight)) / 50;
  const rShares = Math.abs((vests * power * 100)) > 50000000
    ? (vests * power * 100) - 50000000
    : 1;

  return Math.round(rShares);
};

const votesFormat = async (votesOps) => {
  votesOps = _
    .chain(votesOps)
    .orderBy(['weight'], ['desc'])
    .uniqWith((first, second) => first.author === second.author
      && first.permlink === second.permlink && first.voter === second.voter)
    .value();

  const refs = await commentRefGetter
    .getCommentRefs(votesOps.map((el) => `${el.author}_${el.permlink}`));

  for (const voteOp of votesOps) {
    const ref = refs.find((el) => el.comment_path === `${voteOp.author}_${voteOp.permlink}`);
    if (!ref?.type) continue;

    voteOp.type = ref.type;
    voteOp.root_wobj = ref.root_wobj;
    voteOp.name = ref.name;
    voteOp.guest_author = ref.guest_author;
  }

  return { votesOps };
}; // format votes, add to each type of comment(post with wobj, append wobj etc.)

const customJSONAppendVote = async (operation) => {
  const json = jsonHelper.parseJson(operation.json);
  if (_.isEmpty(json)) return console.error(ERROR.INVALID_JSON);
  // check author of operation and voter
  if (customJsonHelper.getTransactionAccount(operation) !== _.get(json, 'voter')) {
    console.error(ERROR.CUSTOM_JSON_APPEND_VOTE);
    return;
  }
  const { error, value } = jsonVoteValidator.voteSchema.validate(json);
  if (error) return;

  await parse([
    {
      ...value,
      json: true,
      rshares: 1,
      transaction_id: operation.transaction_id,
    },
  ]);
};

module.exports = {
  parse, votesFormat, customJSONAppendVote, voteOnObjectFields,
};
