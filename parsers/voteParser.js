const _ = require('lodash');
const { postsUtil, usersUtil } = require('utilities/steemApi');
const { User, Post } = require('models');
const { voteFieldHelper, votePostHelper } = require('utilities/helpers');
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
const {
  getUSDFromRshares,
  getWeightForFieldUpdate,
} = require('../utilities/helpers/rewardHelper');

const parse = async (votes, blockNum) => {
  if (_.isEmpty(votes)) return console.log('Parsed votes: 0');
  await updateThreadVoteCount(votes);
  const { votesOps } = await votesFormat(votes);

  const posts = await Post.getPostsByVotes(votesOps);
  const postsWithNewVotes = await usersUtil.calculateVotePower({ votesOps, posts });

  await Promise.all(votesOps.map(async (voteOp) => {
    await parseVoteByType(voteOp, postsWithNewVotes, blockNum);
  }));

  await Promise.all(posts.map(async (post) => {
    await votePostHelper.updateVotesOnPost({ post });
  }));

  await sendLikeNotification(votesOps);
  console.log(`Parsed votes: ${votesOps.length}`);
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
  } else if (voteOp.type === VOTE_TYPES.APPEND_WOBJ && voteOp.weight >= 0) {
    await voteAppendObject({
      author: voteOp.author, // author and permlink - identity of field
      permlink: voteOp.permlink,
      voter: voteOp.voter,
      percent: voteOp.weight, // in blockchain "weight" is "percent" of current vote
      author_permlink: voteOp.root_wobj,
      rshares: voteOp.rshares,
      json: !!voteOp.json,
      weight: voteOp.weight,
      blockNum,
    });
    await redisSetter.publishToChannel({
      channel: REDIS_KEYS.TX_ID_MAIN,
      msg: voteOp.transaction_id,
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

const voteAppendObject = async (data) => {
  // data include: author, permlink, percent, voter, author_permlink, rshares
  // author and permlink - identity of field
  // author_permlink - identity of wobject

  if (data.rshares === 1 && !data.voter.includes('_')) {
    // calc rshares after week
    data.rshares = await calcAppendRshares({ vote: data });
  }
  const { weight } = await User.checkForObjectShares({
    name: data.voter,
    author_permlink: data.author_permlink,
  });

  // voters weight in wobject
  data.weight = await getWeightForFieldUpdate(weight);

  if (!data.rshares) {
    const { vote, error: voteError } = await tryReserveVote(data.author, data.permlink, data.voter);
    if (voteError || !vote) {
      return console.error(voteError || `[voteAppendObject] Vote not found. {voter:${data.voter}, comment: ${data.author}/${data.permlink}`);
    }
    data.rshares = _.get(vote, 'rshares', 1);
  }
  data.rshares_weight = Math.round(Number(data.rshares) * 1e-6);

  const expertiseUSD = await getUSDFromRshares(data.rshares);
  await voteFieldHelper.voteOnField({ ...data, expertiseUSD });
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

// Use this method when get vote from block but node still not perform this vote on database_api
const tryReserveVote = async (author, permlink, voter, times = 10) => {
  for (let i = 0; i < times; i++) {
    const { votes = [], err } = await postsUtil.getVotes(author, permlink);
    if (err) return { error: err };
    const vote = votes.find((v) => v.voter === voter);
    if (vote) return { vote };
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  return { error: { message: `[tryReserveVote]Vote from ${voter} on post(or comment) @${author}/${permlink} not found!` } };
};

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

module.exports = { parse, votesFormat, customJSONAppendVote };
