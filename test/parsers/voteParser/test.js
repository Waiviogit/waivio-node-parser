const {
  expect, sinon, voteFieldHelper, voteParser, UserWobjects, redisGetter, userHelper,
} = require('test/testHelper');
const { voteAppendObjectMocks } = require('./mocks');

describe('VoteParser', async () => {
  let mocks;
  beforeEach(async () => {
    mocks = await voteAppendObjectMocks();
    sinon.stub(userHelper, 'checkAndCreateByArray').returns({ hiveAccounts: [{ name: mocks.vote.voter }] });
  });
  afterEach(async () => {
    sinon.restore();
  });
  describe('on voteAppendObject', async () => {
    describe('when voter have no weight in wobject', async () => {
      let voteFieldHelperStub;

      beforeEach(async () => {
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
          rshares_weight: 0,
          rshares: 1,
        };

        expect(voteFieldHelperStub.args[0][0]).to.deep.eq(data);
      });
    });

    describe('when voter have weight in wobject', async () => {
      let voteFieldHelperStub;

      let redisResp;

      beforeEach(async () => {
        // mocks = await voteAppendObjectMocks();
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
          rshares_weight: 0,
          rshares: 1,
        };

        expect(voteFieldHelperStub.args[0][0]).to.deep.eq(data);
      });
    });
  });
});
