const {
  expect, WobjModel, sinon, AppModel, dropDatabase,
} = require('test/testHelper');
const voteParser = require('../../../../parsers/voteParser');
const { voteAppendObjectMocks } = require('./mocks');
const { VOTE_TYPES } = require('../../../../constants/parsersData');
const rewardHelper = require('../../../../utilities/helpers/rewardHelper');
const { AppendObject } = require('../../../factories');

describe('voteParser.voteOnObjectFields', () => {
  let mocks;
  beforeEach(async () => {
    sinon.stub(rewardHelper, 'getUSDFromRshares').returns(Promise.resolve(1));
    await dropDatabase();
    mocks = await voteAppendObjectMocks();
    // Set field weight to a known value
  });
  afterEach(async () => {
    sinon.restore();
    await dropDatabase();
  });

  it('should update field in DB on upvote', async () => {
    const { appendObject, author_permlink, vote } = mocks;
    const { field: before } = await WobjModel.getField(appendObject.author, appendObject.permlink, author_permlink);
    const upvote = {
      ...vote, type: VOTE_TYPES.APPEND_WOBJ, root_wobj: author_permlink, rshares: 1000000000, percent: 10000,
    };
    await voteParser.voteOnObjectFields([upvote]);
    const { field: after } = await WobjModel.getField(appendObject.author, appendObject.permlink, author_permlink);
    expect(after.weight).to.not.eq(before.weight);
    expect(after.active_votes.some((v) => v.voter === vote.voter)).to.be.true;
  });

  it('should update field in DB on reject', async () => {
    const { appendObject, author_permlink, vote } = mocks;
    const { field: before } = await WobjModel.getField(appendObject.author, appendObject.permlink, author_permlink);
    const downvote = {
      ...vote, type: VOTE_TYPES.APPEND_WOBJ, root_wobj: author_permlink, rshares: 1000000000, percent: 9999,
    };
    await voteParser.voteOnObjectFields([downvote]);
    const { field: after } = await WobjModel.getField(appendObject.author, appendObject.permlink, author_permlink);
    expect(after.weight).to.not.eq(before.weight);
    expect(after.active_votes.some((v) => v.voter === vote.voter)).to.be.true;
  });

  it('should NOT update field in DB if percent is 0', async () => {
    const { appendObject, author_permlink, vote } = mocks;
    const { field: before } = await WobjModel.getField(appendObject.author, appendObject.permlink, author_permlink);
    const zeroVote = {
      ...vote, type: VOTE_TYPES.APPEND_WOBJ, root_wobj: author_permlink, rshares: 1000000000, percent: 0,
    };
    await voteParser.voteOnObjectFields([zeroVote]);
    const { field: after } = await WobjModel.getField(appendObject.author, appendObject.permlink, author_permlink);
    expect(after.weight).to.eq(before.weight);
    expect(after.active_votes.length).to.eq(before.active_votes.length);
  });

  it('should NOT update field if voter is blacklisted and percent is 0', async () => {
    const { appendObject, author_permlink, vote } = mocks;
    const blacklisted = 'blacklisted_user';
    sinon.stub(AppModel, 'getOne').returns(Promise.resolve({ app: { black_list_users: [blacklisted] } }));
    const { field: before } = await WobjModel.getField(appendObject.author, appendObject.permlink, author_permlink);
    const zeroVote = {
      ...vote, type: VOTE_TYPES.APPEND_WOBJ, root_wobj: author_permlink, rshares: 1000000000, percent: 0, voter: blacklisted,
    };
    await voteParser.voteOnObjectFields([zeroVote]);
    const { field: after } = await WobjModel.getField(appendObject.author, appendObject.permlink, author_permlink);
    expect(after.weight).to.eq(before.weight);
    expect(after.active_votes.length).to.eq(before.active_votes.length);
    AppModel.getOne.restore();
  });

  it('should only keep latest vote for same voter on same field', async () => {
    const { appendObject, author_permlink, vote } = mocks;
    const v1 = {
      ...vote, type: VOTE_TYPES.APPEND_WOBJ, root_wobj: author_permlink, rshares: 1000000000, percent: 10000,
    };
    const v2 = {
      ...vote, type: VOTE_TYPES.APPEND_WOBJ, root_wobj: author_permlink, rshares: 2000000000, percent: 5000,
    };
    await voteParser.voteOnObjectFields([v1, v2]);
    const { field: after } = await WobjModel.getField(appendObject.author, appendObject.permlink, author_permlink);
    const votesByVoter = after.active_votes.filter((v) => v.voter === vote.voter);
    expect(votesByVoter.length).to.eq(1);
    expect(votesByVoter[0].percent).to.eq(5000);
  });

  it('should only update the correct field if multiple fields exist', async () => {
    // Extend mocks to add a second field
    const { appendObject, author_permlink, vote } = mocks;
    const { appendObject: append2 } = await AppendObject.Create({ creator: mocks.creator.name, root_wobj: author_permlink });
    const vote2 = {
      ...vote, author: append2.author, permlink: append2.permlink, type: VOTE_TYPES.APPEND_WOBJ, root_wobj: author_permlink, rshares: 1000000000, percent: 10000,
    };
    await voteParser.voteOnObjectFields([vote2]);
    const { field: after1 } = await WobjModel.getField(appendObject.author, appendObject.permlink, author_permlink);
    const { field: after2 } = await WobjModel.getField(append2.author, append2.permlink, author_permlink);
    expect(after1.active_votes.length).to.eq(0);
    expect(after2.active_votes.length).to.eq(1);
  });

  it('should do nothing on empty input', async () => {
    await voteParser.voteOnObjectFields([]);
    // No error, nothing to assert
  });

  it('should skip missing field and not throw', async () => {
    const { vote, author_permlink } = mocks;
    const badVote = {
      ...vote, author: 'notfound', permlink: 'notfound', type: VOTE_TYPES.APPEND_WOBJ, root_wobj: author_permlink, rshares: 1000000000, percent: 10000,
    };
    await voteParser.voteOnObjectFields([badVote]);
    // No error, nothing to assert
  });
});
