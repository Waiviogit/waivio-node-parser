const {
  expect, sinon, voteFieldHelper, postsUtil, voteParser, UserWobjects, redisGetter, userHelper,
} = require('../../testHelper');
const { voteAppendObjectMocks } = require('./mocks');

describe('VoteParser', async () => {
  beforeEach(async () => {
    sinon.stub(userHelper, 'checkAndCreateByArray').returns({ user: 'its ok' });
  });
  afterEach(async () => {
    sinon.restore();
  });
  describe('on voteAppendObject', async () => {
    describe('when voter have no weight in wobject', async () => {
      let voteFieldHelperStub;
      let mocks;

      beforeEach(async () => {
        mocks = await voteAppendObjectMocks();
        voteFieldHelperStub = sinon.stub(voteFieldHelper, 'voteOnField').callsFake(async () => {
        });
        await voteParser.parse([mocks.vote]);
      });

      it('should call "voteOnField" once', async () => {
        expect(voteFieldHelperStub.calledOnce).to.be.true;
      });

      it('should call "voteOnField" with params', async () => {
        const resp = await redisGetter.getHashAll(`${mocks.vote.author}_${mocks.vote.permlink}`);
        const data = {
          author: mocks.post.author,
          permlink: mocks.post.permlink,
          author_permlink: resp.root_wobj,
          percent: mocks.vote.weight,
          voter: mocks.vote.voter,
          weight: 1,
          posts: [mocks.post],
          rshares_weight: mocks.post.active_votes[0].rshares * 1e-6,
        };

        expect(voteFieldHelperStub.args[0][0]).to.deep.eq(data);
      });
    });

    describe('when voter have weight in wobject', async () => {
      let voteFieldHelperStub;
      let mocks;
      let redisResp;

      beforeEach(async () => {
        mocks = await voteAppendObjectMocks();
        redisResp = await redisGetter.getHashAll(`${mocks.vote.author}_${mocks.vote.permlink}`);
        await UserWobjects.create({
          user_name: mocks.vote.voter,
          author_permlink: redisResp.root_wobj,
          weight: 9999,
        });
        voteFieldHelperStub = sinon.stub(voteFieldHelper, 'voteOnField').callsFake(async () => {});
        await voteParser.parse([mocks.vote]);
      });

      afterEach(() => {
        voteFieldHelperStub.restore();
        postUtilStub.restore();
      });

      it('should call "voteField" once', async () => {
        expect(voteFieldHelperStub.calledOnce).to.be.true;
      });

      it('should call "voteField" with params', async () => {
        const data = {
          author: mocks.post.author,
          permlink: mocks.post.permlink,
          author_permlink: redisResp.root_wobj,
          percent: mocks.vote.weight,
          voter: mocks.vote.voter,
          weight: 9999,
          posts: [mocks.post],
          rshares_weight: mocks.post.active_votes[0].rshares * 1e-6,
        };

        expect(voteFieldHelperStub.args[0][0]).to.deep.eq(data);
      });
    });
  });
});
